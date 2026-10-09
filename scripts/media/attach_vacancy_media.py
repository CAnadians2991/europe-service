#!/usr/bin/env python3
"""
Vacancy pages: our own media from the company Drive (owner, 2026-10: «video reviews must also be on the vacancies
themselves — use everything available»).

Inputs: the Drive inventory built in the media audit (inventory.json: every Drive file with folder path, category
housing/work/review_video/…, dup_of, faces/former-employee check, local path) and the vacancy seed (read only).
Output (only new files, nothing existing is touched):
  public/media/vx/<vacancy id>/<8-hex>-{480,800,1200}.webp   housing / workplace photos, logo burned in bottom-right
  public/reviews/video/<vacancy id>-r<n>.mp4 (+ -cover-480/800.webp)   new clips, logo burned in (process_reviews.py)
  src/data/vacancy-media.json   { "<vacancy path>": { videos: [...], housing: [bases], work: [bases] } }

How the selection was made (2026-10-09, see the report in the task log):
  1. Drive employer folders were matched to vacancies by country + brand/title (+ city), and confirmed where possible by
     the vacancy's existing photos: a Drive folder whose images are already on a vacancy page is that vacancy's source.
     MATCHES below keeps every match that was looked at, with a confidence; only ATTACH=True ones are used.
  2. Candidates: category housing/work, downloaded, not dup_of, no former-employee flag, not under «PERSONAL WORK…»,
     not under «тимчасове житло» (transit housing), not already on the site — 16×16 dHash (min of full / top 78 % /
     left 70 % crops) Hamming ≤ 10 against public/media/{v,r}, then SIFT + RANSAC (≥ 25 inliers, bottom 18 % masked
     for overlays) against the vacancy's own photos and housingPhotos, because the old site used re-cropped copies.
  3. Every candidate was looked at on contact sheets. Housing: real rooms/kitchens/baths/buildings, sharp and lit, no
     people, ≤ 8 per vacancy. Workplace: only our/clients' phone shots of the real site; employer press, stock, ads,
     logos and Instagram reposts were rejected (that was almost everything). Housing from «Польща | Реклама/…» ad
     folders was rejected: they turned out to be copies of other employers' housing (e.g. 6_Philips = EWL/BG Production).
  4. Review screenshots, documents, ads and personal files are never used.

Usage: python3 scripts/media/attach_vacancy_media.py --drive <dir with inventory.json> --yunet <yunet.onnx> [--dry-run]
"""
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile

import cv2
import numpy as np
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
MARK = Image.open(os.path.join(HERE, 'watermark.png'))
SIZES = (480, 800, 1200)
QUALITY = 78
VIDEO_DIR = os.path.join(ROOT, 'public', 'reviews', 'video')
OUT_JSON = os.path.join(ROOT, 'src', 'data', 'vacancy-media.json')

V = 'Вакансії/'
PL = V + 'Польща/Польща | Різноробочі/'
PLA = V + 'Польща/Польща | Реклама/'
ESI = V + 'Польща І Реклама ESI/'
NEW = V + 'матеріали для нового сайту/'

# vacancy id -> (confidence, attached?, Drive folders, note). Folders with nothing new for the page are kept for the record.
MATCHES = {
    'snhd3v1f41': ('high', True, [V + 'Нідерланди/Сортувальник тюльпанів_esi', NEW + 'Нідерланди/Сортувальник тюльпанів'], ''),
    'es736992y1': ('high', True, [V + 'Чехія/ROHLIK', NEW + 'Чехія/ROHLIK'], 'video: Karina, grocery e-shop warehouse in CZ (only such vacancy)'),
    'peajpdn441': ('high', True, [V + 'Німеччина/Працівник готелю'], 'folder = vacancy title; video: Polina, hotel worker, Kiel'),
    'ral931v4u1': ('high', True, [NEW + 'Німеччина/Робота у 5-ти зірковому готелі'], 'its existing photos come from this folder; Kiel is in its list'),
    '9legx8dt21': ('high', True, [V + 'Греція/Працівник готелю'], 'folder = vacancy title; review + housing videos from it'),
    '3po2letnz1': ('high', True, [V + 'Греція/Прибирання в готелі Партнер №21', PL + 'Прибирання готельних номерів в Греції'], 'maid programme; phone shots of a partner hotel; Telegram clip Oksana (maid, Crete)'),
    'okggzvdvt1': ('high', True, [V + 'Греція/Робота кухарем, офіціантом, покоївкою в готелі в Греції'], 'its existing photos come from this folder'),
    'hpa5z11dk1': ('high', True, [V + 'Угорщина/Kifli'], '3 Kifli clips (Liza = Telegram clip, Nazar, Natalia)'),
    'tuejek8bj1': ('high', True, [V + 'Угорщина/FLEXTRONICS'], ''),
    'hfjen58ug1': ('high', True, [V + 'Угорщина/MILUPA_esi'], ''),
    'jfo50sxzk1': ('high', True, [V + 'Угорщина/SYOSS / GLISS KUR_esi', V + 'Угорщина/SYOSS '], ''),
    'g7l2m5cx21': ('high', True, [V + 'Румунія/APTIV', NEW + 'Румунія/APTIV'], ''),
    'en5fe9t6u1': ('high', True, [V + 'Румунія/Agropan', NEW + 'Румунія/Agropan'], ''),
    'au85es7vl1': ('high', True, [PL + 'AMBRO', PL + 'Ambro Express'], 'only Ambro employer; both Ambro vacancies are Przykona'),
    '1lfvylnhm1': ('high', True, [PL + 'AMBRO', PL + 'Ambro Express'], 'same as au85es7vl1'),
    'y1trd92pm1': ('high', True, [NEW + 'Польща/Кондитерська фабрика Ferrero Rocher', PL + 'Ferrero Rocher'], 'overlay «Ferrero Rocher | EUROPE SERVICE»'),
    'ujz1ie48n1': ('high', True, [PL + 'Biedronka'], 'source of the existing housing photos'),
    'p785274952897': ('high', True, [PL + 'H&M Gądki'], 'city match'),
    'p826637026213': ('high', True, [PL + 'LG Energy', PL + 'LG CHEM'], 'overlay «LG Energy Solution | EUROPE SERVICE»'),
    '7jn0x6lk61': ('high', True, [PL + 'LG Electronics'], 'source of the existing photos'),
    '9sac1vijm1': ('high', True, [V + 'Фото житла ES/VALEO CHRZANÓW'], 'city match'),
    'p554023348321': ('high', True, [PL + 'TENNECO', PL + 'TENNECO RYBNIK'], 'its existing photo comes from TENNECO; Stanowice is by Rybnik'),
    'od4erujyu1': ('high', True, [PL + 'DR SCHNEIDER', PL + 'DR. SCHNEIDER'], 'source of the existing photos'),
    'e4i46f0b01': ('high', True, [PL + 'Amazon/фото житла/житло крайкув', PL + 'Amazon ID Logistics Wrocław Krajków'], 'overlay «Працівник складу | EUROPE SERVICE» = vacancy title'),
    'fdybjuvd91': ('high', True, [PL + 'AMAZON Chojnów', PL + 'AMAZON'], 'city match; AMAZON is the source of the existing photos'),
    'c2u12r89z1': ('high', True, [PL + 'DINO/фото житла'], 'DINO is the source of the existing photos (Brzeg has its own subfolder)'),
    'rrnox0tae1': ('high', True, [PL + 'ID Logistics (ZARA)', PL + 'ZARA/фото житла/житло 2'], 'source of the existing photos; Telegram clip Nadiia'),
    '2n9rnnfnf1': ('high', True, [PL + 'Rhenus/м. Swarzędz', PL + 'ZARA/м. Swarzędz'], 'city match (Rhenus runs the Zara warehouse there)'),
    'cythe4x3r1': ('high', True, [PL + 'Rhenus Poznań'], 'source of the existing photos (Swarzędz)'),
    'v4kdpmurz1': ('high', True, [PL + 'Арвато', PL + 'ARVATO STRYKÓW', PL + 'Arvato/ STRYKÓW', PL + 'ARVATO STRYKÓW ZARA'], 'Arvato Stryków = source of the existing photos'),
    's9i2b11iu1': ('high', True, [PL + 'LPP'], 'source of the existing photos (12 km from Bydgoszcz)'),
    'v71s1goc61': ('high', True, [PL + 'LPP'], 'Sinsay = LPP, Przyłęki = the same «12 km from Bydgoszcz» site; different photos than s9i2b11iu1'),
    'p834282937601': ('high', True, [PL + 'PANTOS LOGISTICS Nowa Wieś Wrocławska'], 'city match'),
    '9ttka6all1': ('high', True, [PL + 'CCC EU (HalfPrice)'], 'overlay «CCC (HalfPrice) | EUROPE SERVICE»; all 3 Half Price vacancies are Polkowice'),
    'jy7b60a5g1': ('high', True, [PL + 'CCC EU (HalfPrice)'], 'same'),
    'rh6xpaavp1': ('high', True, [PL + 'CCC EU (HalfPrice)'], 'same'),
    'dzx586rik1': ('high', True, [PL + 'ССС'], 'source of the existing photos'),
    'hd74fzfju1': ('high', True, [PL + 'Швачка на автомобільний завод'], 'folder = vacancy title'),
    'lgrl5hgms1': ('high', True, [PL + 'INTERCARS', PL + 'InterCars'], 'INTERCARS is the source of the existing photo'),
    't2dzrgl9i1': ('high', True, [PL + 'MOTHERSON'], 'source of the existing photos'),
    'ac3mvy37x1': ('high', True, [V + 'Німеччина/MARS'], 'phone shots inside the Mars warehouse'),
    'ey5erxjj71': ('medium-high', True, [PL + 'GRAAL'], 'only GRAAL vacancy; phone shots of salmon filleting = the job described'),
    '7yudiss8f1': ('high', True, [PL + 'Dirks'], 'Telegram clip Oleksandr + client housing tour from Dirks/відео з житла'),
    'vesnncyix1': ('high', True, [PL + 'Amitec'], 'Telegram clip'),
    'djjpfugd71': ('high', True, [PL + 'SANTE'], 'Telegram clip'),
    'ekohn8n9n1': ('high', True, [V + 'Литва/Працівник на виробництво картону'], 'Telegram clip'),
    # looked at, not attached
    'yxt8reb561': ('medium', False, [PLA + '13_Nutella'], 'ad-folder housing (a country house) — ad folders reuse other employers\' housing'),
    'p867288368781': ('medium', False, [PLA + '1_Puma'], 'ad-folder housing'),
    'p692795933081': ('medium', False, [PLA + '5_Ecowipes'], 'ad-folder housing, professional hostel shots'),
    'p365590952231': ('medium', False, [PLA + '6_Philips', PL + 'PHILIPS'], 'ad housing = EWL/BG Production copies; work = group photos with faces'),
    'p151020235971': ('medium', False, [PL + 'LIDL'], 'folder says «Житло (приблизно)» — approximate hostel shots'),
    'o03bpgl1i1': ('medium', False, [PL + 'Żabka'], 'housing location unknown (shop in Zakopane vs warehouse)'),
    'fr1dsgnlo1': ('medium', False, [PL + 'Biedronka'], 'same employer as ujz1ie48n1 but different role; not duplicated'),
    'kntgtb0ei1': ('medium', False, [PL + 'Biedronka'], 'same'),
    'vs4xleztp1': ('medium', False, ['Відео з відгуками (IMG_0130, Андрій)'], 'roses greenhouse NL, but he says housing is free; vacancy housing is 100–135 €/week'),
    'p223311721743': ('medium', False, ['Відео з відгуками (IMG_1722/IMG_1724, Петро)'], 'poultry plant in Poland — employer not named'),
}

# Drive file ids, in display order (picked by eye from the candidates, see the docstring)
HOUSING = {
    'snhd3v1f41': ['1522tETUDD0pVIhjJzMdAUNRIxLzAa9QE', '1Vy_S94b4bISeuBs8r8MlsypiFiAL42n8'],
    'es736992y1': ['1_29PFWQNHSpDpuSzNLjjoV9GNuZ-5S8Z', '1YVoxcaMvsxEgYgyYBoRTFEzMaPEbkU6Z', '15FH8GNLc_PwzribjRNdcqYMtbpNVHb0_', '1rh2_b0J_dk9od3MJfnHyYv1rKc674421', '13jTWKlcEPsrPpil0m0s4rnzWfIGx2HCE', '1wvt7_lZQoXlISV78rbICMAXF1TjQkXrD', '1NkKrMAUp9u3fSFqp-55B9kU0lMcKb9nW', '1ZfJ9jDRKsE3JPRjCndgAa2CgkKGJ5SVE'],
    'peajpdn441': ['1Y5XLjtgDqLIq9o3Sm0eKiIYTDEkporpA', '1DZFHR3AnZw4yV6Hm3LYFqVShK651Lgb5', '1YOsj9BPa956tk6nnZOW1BAk7gqqGbC2g', '1H_Bh1QjR5XPTcOE7VbYVpbyhS1UEjrtg', '13ZXXAg4EVZS4Pz3Q1_lBtnFszr-utpzD', '1nO3_driTT1MhKxPBsWlIgDAfG9lsMYgv', '1HpUVVOXX_OkHHbA74nMJ6F92DNgTb6xZ', '1eVzUcfqomvaCmdtPAlPwqfxi1UKrdiDs'],
    'ral931v4u1': ['1tFFYMwir8lJgcpcrjjLe34CIlCGEsJ5O', '10Fo7eWTRXPJN0VDS8jGXbGrCPi32ACqE', '1FPW7FgY5G6JkQhKHZJ_a2_389oBXGH27', '1Reja_dXllyPHWPDo_u_F_a_L1Lip9W9-', '1gBQQJyUvUTfv3LMGqLYIosaHMGB9P55a', '1evrGOa-K9BoaeGjFElt5_gN2co9lj-SN'],
    '9legx8dt21': ['1Kkyy2TCyy1OXxmc-L6ofaIrMXeAzG_Ms'],
    'okggzvdvt1': ['1qHFJ4woludw3oaBYvkLH_yrXANo20Dj2', '1wXdxa8VaNbUArZ_LnVmK1jsEHhpP9NaI', '1LxOfYzxuiOmBjRpdobVkhUHto6hDzzG5', '1oy4pm7BoJysM7sDq39hzZ8OjxIoYTscJ', '1bWt_lFcP65ZmOX4NS57ME1m_--5YD2Ny', '1XMtIiAibH2znlr8-JMv6PlFkXhWzCjeb', '137fRV7IkAoS58V5jYucVG6hd3r5ThhYF'],
    'hpa5z11dk1': ['1FVkSr0R9yNs0scFE0KGTW1nkbIiuhL1T'],
    'tuejek8bj1': ['12BcvqlhHGrNdJDkP9Y8DHHp2ru5WMJG8', '1cqXxha7H7FTIAhKZDjaEHrnznsMKEkVM', '1pTOQZihs_d9WzdKpXqOg-flaxHmG0vW-', '1aY61dmWn-6kKXqGkrZknnzz73Sn9kHP3'],
    'hfjen58ug1': ['1qp72XF23Hk5jPfrei0g4Yz5NPCvb8-Uz'],
    'jfo50sxzk1': ['1gfL05lSxA7i63sfJvO0lfmq8Ntm1Ddn3', '1ttMU35v-MhsXajZakmfPP6NqXWzZJqwh'],
    'g7l2m5cx21': ['1_BomPG0yz35QVM3ISVaL-WMX9e2onmpn', '1c8jllmlCNDV2abIQm3KdDR2UgjZPFhli', '1aaW7qv5U9w8WivNF0zBIEdqxe2JQ7qQY', '1pPGQzCBqW3Hmpi5psDQIEVtjU1QFrzQS', '1fwRjeBudNTev6eQUQfuBHF5R9RFvZuAP', '17A-HZCFwWN59D-Nh742euevpJr6tVfNc', '1nZf0_ckHLDKgrTZWGF2IDPdhfps3jsyb', '1SxHfD4ONhCa0cuyxeK10HqpUw1RFJ-CM'],
    'en5fe9t6u1': ['1XmiNx4Dcp6_N4bvWsUoZ3qkVXF-8qGx2', '1cRV7KT0eBTc8Sdo3PVnxz18OSgSBp_kf', '1d2AZLzBtR6jCGTPnKXiX86vwtfi6n4EY', '1_Q1LvRB7Jy59QLu_H8zxkQnpKHcGHVWB', '1HTmSuGkGGYKozKy4aEOx7-XnAu0M1NFd', '1M8vtjOEiZQZvmWwqQPDWOv_yosG9oK6M', '1pdeZiWYXCjwMGR98JTF9SfgCOypEOGRi'],
    'au85es7vl1': ['1Rv2SeFVow2fS2rDnu2RmFSB9GiNUOGZS', '1Do3Fi_w6I0ypwClRm-YtkPtG6vbIKPD8', '1EL2vzds042tm7pR3W8N2-piTbNQsBn9_', '13_ZwyjqQOjH6UF9qkbxEfkREllXjFvUB', '1M8anuwsPHV8IKWaPIKCn8bI4oiashHUv'],
    '1lfvylnhm1': ['1Rv2SeFVow2fS2rDnu2RmFSB9GiNUOGZS', '1Do3Fi_w6I0ypwClRm-YtkPtG6vbIKPD8', '1EL2vzds042tm7pR3W8N2-piTbNQsBn9_', '13_ZwyjqQOjH6UF9qkbxEfkREllXjFvUB', '1M8anuwsPHV8IKWaPIKCn8bI4oiashHUv'],
    'y1trd92pm1': ['1dqYJyIHFM1vL0YFpWfR2l5loc7ryvGYb', '1KRYWKZVvh6sUeDqcEVWNQf1yuKTX1P7a', '17KUR3dgmikdA6X_r0aQYjxLg0wCDzL78', '19cBRtiyL-X6g40M9qDTzd8i__2Fo8EvS', '1gzpIaReEbuLZkZiXp4ziVLS759LlYlRC', '1RbGqAQN5CErMQxD3yBbvbeFnB8Y0WQ5N', '1tSJlwLwoATXDLGQkN2KXRLMhLNhk6esh', '188rBFne9Dp3fQX7aypRRItenqAAT7TXY'],
    'ujz1ie48n1': ['1g5syMUtbHvdNpPAo5KI9PtPdZUAQ3yXk', '1nqniNWw15Z8gGUQ6AbRDdRPwxF1ARwHy', '1mDj4iF7ELztcpFI10PPGeuOiMlTaKFgN', '1cI6f8Sib6YH1FvFGiH5VzXVa8FUDTShn', '1q51Tf9iDUGjB0Si9B0quA_RMX_MU_Chc', '1xWpnyUJjV95jZ9KBRduLypW9nOQfLt8k', '1jhmxDntDadz20RcG9mcGnqw5g-1AgEd4'],
    'p785274952897': ['1Gcm-sQBQtNPQ95-NHKEhm-LWAUejd2QS', '18O3Hm9kHMyhfnKaXmaaU4LtjTRQr2_wJ'],
    'p826637026213': ['1RVKjQbHDVueINJWTpEXr8kVutUJynZcr', '1eunj2oQBq_o9WzAi-Z_GFcdOQWx9cheN', '1F3LEab_qL5CfsYdfPM5Id-H2WdUutrRR', '1gfOQskFP2fNRmb27U2h8bVvNTqFTZt-d', '1HerxPrnlkOPknp7qaLyxbggXEz_wcB6U', '1UYHTqmsUycdV6rKFyLzLCiuJdTXYd4cd', '1mjhBQt_B4Wr3I9M6cq_nbQrkAcy1gxV4', '12jISL2rySvUjNlP98AXAa1ABXG09ueN5'],
    '7jn0x6lk61': ['17ccRMB6ynR1qcx2h3JbUprtfJztwvkx2', '1bBdszoTudVHer_s3P6niNUu_GI5SWRYt', '1FRCWz97VDD7qLQr3xeBP4OXs2iJrQVm7'],
    '9sac1vijm1': ['1TEpoKGBllfgZ94IBsdGgPzfXbmANooVP', '1UoZVuBWyM_3raRGJ8RvSLJhsS6rIh_JX', '1n2xMsXTEqM6T926zitHm_hFudlkExuNJ', '1xTD0N4Vo44Htrn4A2_A7Zmz4dtDRx0uX', '1KX2CmMrJsLc9W1pGgd44uapnlo6PJM_l', '18fSIxzXSP3pMNQZULZv2zZ_feeBH6-SJ', '1dYE-iO66b-pEOg7DfuEuu1Fxd_d3eJZ-', '12IF45UJsbmwZ7J97pDb-Hq_HElpz-Qwd'],
    'p554023348321': ['1sefgvHEfeXTnNNtvT7WwsEo3QbHuetgn', '1xJd19W-fOfXh6YVZCYu1zAHwKago-8d_', '1uw2QDbUKXMWUgnuh3zL5yzi4dhRcQgwj', '1YhzIcrJELu_uo62H8v5uyzOtn3CPe6v8', '1YKXXd-aw6MHTfHHsezojmJOQUqtuhjXr', '1yihnmuMiRfVtzvQ-MJdR-57OhzxVOAIr', '1nXDs73fZvmwiPnnzX5cp6kYUvDBlgatu', '1QW5tYgqEE_otGW0GGpwHnBu2icwcdybU'],
    'od4erujyu1': ['1WzQM7e_rlUsc-Bv19YIvRsmCBOGutagJ', '1KrIM_0ZF1cXWSj4Ca99BOn9j0zIddrUV', '1mT2d3KBqqaM00zdzvJ8pAmy_23ApU4g8', '1cKcKYnBWskM51ltRvkKa4hiaCqs5VlVP', '1y4-ybFAF-PAKS6TQ6QPSQxfrdJrQjUmH', '1osf3wBsmS_67RTu7-mxFv4DzAp28Sorv', '16HEY8wQ0GyX1cjbyRNNBqUrSCkxOuOhn', '1hq-E0GtXCm8E6rBEhy-FNP6MDvhs2XD_'],
    'e4i46f0b01': ['1UG1vB99ZyrYco13vnJ0wF1XBrVCLB7tR', '1xS2osxyKnAjfRLco0ijlQQSNUEjvheMt', '1bLZR_HFlCOSrFZ3Roy3g8nJLeecnsL7A', '10t4lHqrVWXq9vSIdpxJIFJV64FYmLyN4', '1LWkuFmwjvnbpcrnjY2pqaiiDKJxZxcv5', '1zHYouYH8Akl66dVXLevshPLyYQBxFB3f', '1v0ECcBdSycA26EQInwCj1bjdudkejPtL', '1Era9-p3glbdZJjMG0Utmj9wKv6uVb1i7'],
    'fdybjuvd91': ['1levspz-nKYOtsDR4sK4-3AgxKZIeN5t4', '1742p6SywWp1IE84J5aNWHyATfu7r2L_x', '1C1_LXRrPmcsUfE_S-7tgUEaHD_Qyhz6c', '1OZP57ytLQFJLAQQ511ehMjSY6yrkGlSf', '1MFUjBnB96ayxvl0_8qWN7dLgXhDcTMEe', '1rX6hu6pPaE3mvynmc4BRn7sSfiV7o2Je', '1d7khXfwA_ZQ2d2xwPHumJFW6VzQxte3P', '1MBiScO830lTLTUB0rHuvgQLFDZDlCjq8'],
    'c2u12r89z1': ['1wKEKWtIKRC174hzpnYni3auKQ_YvpK9W', '1W0YPG0SrCEXsvBOUDcoudZS1JrPg8e37', '1k_H3kYrMRSFS-6FNr2KsSvGocJctkB-G'],
    'rrnox0tae1': ['1acXoci0AAqKqMaNWeKFDt_Shf2ijOcZJ', '1e_8K1JaOD6HfSqq0quWouweYr9fiuOfF', '1pF6FEfBe6SmaRwjHwgEo4MuJ2y5B7Nfh', '1Vis9s6yxR7CrFAbjHCR0q03_ZegW2pjC', '1ZPdac-mIGAWLHTlXiZl59WWR-qBmWdML', '1iLxslYpOtCFpto8rUgEOd9LRJXL9wKgA', '17KTDH-rYQemiLnwymwwugDOITfJ-e7iV', '1YkFqbYWO9ql3wEMPpeLOLuZSzEdXD9Qu'],
    '2n9rnnfnf1': ['1r7ulGg8zQSTeRLemia9SiIAO5mm057Pi', '1P_he6oJIu5Qi5zxRfgXtkjWtfqjHiy6B', '1TvQkPjv6Yqzm9OA77o7cUbuqDkF2HvEJ', '1irqcr90PW9qBF-1hofLtxo3_2CKQhPv9', '1orIaksL01wQlHUbQ7rDc-42l-SyTm52a', '1O9F6fd7HnFPDsOLDXqwXB4CbBQxWkcDz', '13Kr0FOzqlLgwvV39PY3y8bGfTxPd-ty5'],
    'cythe4x3r1': ['1hOqB4Ezh5wSmFe4BcGB5TcI1QaQObVKr', '1WQKaDaucuqIzEarrYxj0v3yZKtolFZJ-', '1VAgcZ5w_n0TC6dlfPoWC5H6Pu9l7I5bC', '12Xz-LuTLKdrj4QrxIDfl_Q7eJcrJvOii', '1JUPLcZNzyh7gZ67JUszyAb14YdzNjWUo', '1fGiwKXpkm0BbMQP9CNn1cjxW49W2rEev', '1x5E7bHijWZN-snKrFDsUkKqYLZs2OlEm', '1TQiUvsCXsH91PXqpzY2Qs-venzbVZgUc'],
    'v4kdpmurz1': ['1sqaYdy7EgGE_bl-n4-JH8ulD20HoS_Dr', '1sgrAMhpoZ_4OerVY_BkIY6kVUnhk0A9F', '1EWAIDZJKASK1WSuXMzvmgTcGi8NG-Ykd', '1c4dDO5t02nW_lpaSld58LuN-N04ZO1lb', '11t31hPGcpCzW7Not7n_mSuwwSW4Z3nN8', '139ANnQqHMGI4ULHFYzNxVT-FpbWUhr_q', '1xHb9fCM0lJnRC1qjKOhZItJZFGe38-j7', '13SQXzK9riRVxDO9km-rD_FY-WwZCPx51'],
    's9i2b11iu1': ['1N6wRtMht5Ha1mr3NgN4_gsJsZskOM0Cq', '13NiSr6BF0b3pKyCht9lzRdzSKC_cqE4o', '1R-F9XiobrSsln50GsbngM5Ako9UmLj-R', '1Bk7swrxkrukFKFGkBXe_6fjPn_hYIJph', '15wig1na9qMrEGnn1zelBVflsEv3TEA9E', '1MG9qLIH3xnCsSix9AHEgKPomAzTVy0Ge', '1Q9UKmSjRoKBTK3uTx3xW5GL0NkJgHF2n', '1PFPj-NXX_2vPu_88dLOQgNEJl4QBidV4'],
    'v71s1goc61': ['1hmWCE31HsuoR9aB9U1W55PCN2bQ6svGi', '1Sz1DIX674x5guPdHcnk8UH4aByTRoFSL', '1mX_Rk9joRGTdSZs7n5vlk_a6tvRwzKJB', '1EZN9oZLBxWwxg5VVR5OaUWnfVjRe_KrR', '11c9KJPlEBAOgRDjCisyHcqwcEesMCAqS', '1_LoReJralr_j7cWMNIOPWQ5oIOzkAFeD', '1LjJ6M0l4FkTN6qnKuZrPJ_44tD4G5lfR', '1qmAS0jHeolFHSOX2m2YtsU6j9MXhAh3S'],
    'p834282937601': ['1lFKn6kuoZQj2KhdIEphF_ATwisgBT2hM', '1liqwTBmEY_NOiwCFVeDfPGBSSOJucSdl', '1FLDZRQRNNqB-gj5XeMp6zVLaRUu614dV', '12ypFEgHyX844f5MJDf0zjYCDcqQTZQkE'],
    '9ttka6all1': ['121oEU8RuiU_FZB5ebDCAtRrYZSQLpALI', '1ePQJDzqA6pbNcoekN3VWtmdCcGDaTfDb', '1f-9qVgt7IHfCnfO3rxr6ziNUfEtjkeMk', '1IsBCuxVw3hv9yYz8RC_hgy_6AUE5VrRa', '1W8Quvc-xeFREYsatlhCrUSqsJgIcYrn9'],
    'jy7b60a5g1': ['121oEU8RuiU_FZB5ebDCAtRrYZSQLpALI', '1ePQJDzqA6pbNcoekN3VWtmdCcGDaTfDb', '1f-9qVgt7IHfCnfO3rxr6ziNUfEtjkeMk', '1IsBCuxVw3hv9yYz8RC_hgy_6AUE5VrRa', '1W8Quvc-xeFREYsatlhCrUSqsJgIcYrn9'],
    'rh6xpaavp1': ['121oEU8RuiU_FZB5ebDCAtRrYZSQLpALI', '1ePQJDzqA6pbNcoekN3VWtmdCcGDaTfDb', '1f-9qVgt7IHfCnfO3rxr6ziNUfEtjkeMk', '1IsBCuxVw3hv9yYz8RC_hgy_6AUE5VrRa', '1W8Quvc-xeFREYsatlhCrUSqsJgIcYrn9'],
    'dzx586rik1': ['12ANDbnJ8lJo5XFjivvzL0lGrjahcRNO1', '17sxjFsVbRvx4ertsg_2WWKIBuOMGuTsu', '1CAsKEwXO5BnADKtqk-WdsZYCR7NpN9id'],
    'hd74fzfju1': ['1CG1h-gWqMKDrbOckPqPBPIEs8iI8J-20', '1c9JynF7cVzQ7n7hnren9VeopAo44Kxjo'],
    'lgrl5hgms1': ['1NBeye8ZXA4oK9X7exL865b5oaDvKO6Q1', '1yoUJN8WmMND93iiJxBXKzpQM7RrtEbXu', '1rNcxPx4qL-5aETZ35XJ3fcVMssoinW6C', '1JKrkVZrv1c1YtbuHcFtTz_UBXmshGSN1', '14OLS-I1ju1fUOvdTvaryLBAdrYsJ9EKe', '1Fl6L7sPRIMaFgA1-rM5oU0FX1FO1Tlsf', '1LI6-dcsP90JdqXHIDsVGYLel1ifgpGqR', '1YWqH5NxueHI26pPz5AQklx7tAbPjeDeM'],
    't2dzrgl9i1': ['1dboTu0jg7pOX0cVUKj4wFpqnoEZSATdc', '1X6XoGrhdsL5t7s6indnpeWfDJ0tvu_Qp', '1C1y-JJGcW6wX2LMZs-CVYFkqbFz21nuS', '1qBTKe-C-htN2SfwgMmYFNI2eC2frqh7a', '1iAXdg3ExzV509tQpiT6k2-2uxu9efv8w', '1gJs6RnL4YEM7kSoV10A3pFefciXdTMcy', '1TNX27GxmtYofGjwVxGNrEA-cW0kfsItc', '16plBfWVsRPf4rdXF-cRUc799ZPDs5WuX'],
}
WORK = {
    '3po2letnz1': ['1SL3XQxJ_CQgNsuqMBZOuonn47jb1fhBp', '1aQXZvQdbX2XQwBRcBOcnVb0tiWYahWi3', '1IJVNKcjf-_e_3d44r-kqyj5mLg2n_gAV', '1c9TFoOI-rd4iqQuFC6IJ9XIK3Ox48aim'],
    'ac3mvy37x1': ['1EI5Cj1rRCckas-3VAYc8nJ33XqHc6Xqe', '1hCXYru73qhjwt4uxcTENavi6nGf4VNH_', '1H0m_X806K7lh0fQh5IFec61v55rjHe_U', '1eu2wNHUY2Zi8aSfPrZ76uLRFRiTnYTKj'],
    'ey5erxjj71': ['19aAtlVcvs8BaVY74ThcMhtN-L_RMBN9T', '182iGS-kOFyeecc9EJjtrBS7z_smxJd_C', '1_xU-LA9lwBgOm71VTFDSEyfmmX-AkdLN', '1ETdddQ3BEleaskgxyWJGsLQLIxLUZaNN'],
}

# clips per vacancy. Existing files in public/reviews/video are referenced as they are; «src» = a Drive file id → new clip.
# Titles only from facts said in the clip / its Telegram post.
EXISTING = {
    'kifli-budapest-2025-09': ('Єлизавета', 'Склад Kifli в Будапешті', 'Склад Kifli в Будапеште'),
    'nazar-kifli-hu': ('Назар', 'Kifli в Угорщині', 'Kifli в Венгрии'),
    'natalia-housing-hu': ('Наталія', 'Огляд житла Kifli', 'Обзор жилья Kifli'),
    'karina-food-cz': ('Каріна', 'Продуктовий склад у Чехії', 'Продуктовый склад в Чехии'),
    'zara-psary-2026-04': ('Надія', 'Склад Zara: мій досвід', 'Склад Zara: мой опыт'),
    'amitec-sternalice-2026-03': ('Сергій', 'Завод Amitec у Польщі', 'Завод Amitec в Польше'),
    'sante-stodzew-2026-02': ('Андрій', 'Фабрика сніданків SANTE', 'Фабрика завтраков SANTE'),
    'karton-panevezys-2025-08': ('Віта', 'Картонна фабрика в Литві', 'Картонная фабрика в Литве'),
    'dirks-krosno-2025-01': ('Олександр', 'Склад зоотоварів Dirks', 'Склад зоотоваров Dirks'),
    'hotel-kiel-2026-01': ('Поліна', 'Готель у Німеччині', 'Отель в Германии'),
    'pokoivka-kryt-2025-04': ('Оксана', 'Покоївка на Криті', 'Горничная на Крите'),
}
NEW_CLIPS = {  # name -> (Drive file id, kind, client name, uk, ru[, cover second])
    '9legx8dt21-r1': ('1wESxT2r1pVd7n0M8OA6ocoViq-FGZili', 'review', '', 'Прибирання в готелі на Криті', 'Уборка в отеле на Крите'),
    '9legx8dt21-r2': ('1eEeWiK2KxDtOtbsYIRy_H5HYliAGjjqV', 'review', '', 'Робота в готелі в Греції', 'Работа в отеле в Греции'),
    '9legx8dt21-r3': ('1i8ep58BGLvbcIDmMb88GuyFlV1miZkj9', 'housing', '', 'Житло персоналу готелю в Греції', 'Жильё персонала отеля в Греции'),
    # opens on the lodging house's sign («…ALCZAK»), so the cover is taken from the kitchen shot instead
    '7yudiss8f1-r1': ('1r11DXKEXiCl79p1nJrS8ZAFhdKn54hS8', 'housing', '', 'Огляд житла Dirks', 'Обзор жилья Dirks', 28.0),
}
VIDEOS = {
    'hpa5z11dk1': ['kifli-budapest-2025-09', 'nazar-kifli-hu', 'natalia-housing-hu'],
    'es736992y1': ['karina-food-cz'],
    'rrnox0tae1': ['zara-psary-2026-04'],
    'vesnncyix1': ['amitec-sternalice-2026-03'],
    'djjpfugd71': ['sante-stodzew-2026-02'],
    'ekohn8n9n1': ['karton-panevezys-2025-08'],
    '7yudiss8f1': ['dirks-krosno-2025-01', '7yudiss8f1-r1'],
    'peajpdn441': ['hotel-kiel-2026-01'],
    'ral931v4u1': ['hotel-kiel-2026-01'],
    '3po2letnz1': ['pokoivka-kryt-2025-04', '9legx8dt21-r1'],
    '9legx8dt21': ['9legx8dt21-r1', '9legx8dt21-r2', '9legx8dt21-r3'],
}


def load_process_reviews():
    spec = importlib.util.spec_from_file_location('process_reviews', os.path.join(HERE, 'process_reviews.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def base_id(drive_id):
    return hashlib.sha1(drive_id.encode()).hexdigest()[:8]


def make_photo(src, out_base):
    """resize to ≤1200 px wide, logo bottom-right (~26 % of the width, as watermark_images.py), three widths, q78"""
    if all(os.path.exists(f'{out_base}-{w}.webp') for w in SIZES):
        return False
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    if im.width > 1200:
        im = im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
    im = im.convert('RGBA')
    mw = max(110, int(im.width * 0.26))
    m = MARK.resize((mw, int(MARK.height * mw / MARK.width)), Image.LANCZOS)
    pad = int(im.width * 0.025)
    im.alpha_composite(m, (im.width - mw - pad, im.height - m.height - pad))
    im = im.convert('RGB')
    os.makedirs(os.path.dirname(out_base), exist_ok=True)
    for w in SIZES:
        c = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        c.save(f'{out_base}-{w}.webp', 'WEBP', quality=QUALITY, method=6)
    return True


def housing_cover(pr, path, det, out_base, at=None):
    """cover for a housing tour: the sharpest frame without a face, from the middle 80 % of the clip (or around «at» s)"""
    cap = cv2.VideoCapture(path)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    best, score = None, -1
    frames = np.linspace(n * 0.1, n * 0.9, 24) if at is None else np.linspace(max(0, (at - 1) * fps), min(n - 1, (at + 1) * fps), 9)
    for i in frames.astype(int):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(i))
        ok, img = cap.read()
        if not ok:
            continue
        h, w = img.shape[:2]
        s = 640 / max(h, w)
        small = cv2.resize(img, (int(w * s), int(h * s)))
        det.setInputSize((small.shape[1], small.shape[0]))
        _, faces = det.detect(small)
        if faces is not None:
            continue
        g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        sc = cv2.Laplacian(g, cv2.CV_64F).var() * (0.3 if g.mean() < 60 else 1)
        if sc > score:
            best, score = img.copy(), sc
    cap.release()
    pr.cover(best, None, out_base)


def mmss(path):
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip())
    d = int(round(d))
    return f'{d // 60}:{d % 60:02d}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--drive', required=True, help='folder with inventory.json and the downloaded media')
    ap.add_argument('--yunet', required=True)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    os.environ['PATH'] = '/opt/homebrew/bin:' + os.environ.get('PATH', '')
    inv = {x['drive_id']: x for x in json.load(open(os.path.join(a.drive, 'inventory.json')))}
    vac = {v['id']: v for v in json.load(open(os.path.join(ROOT, 'src', 'data', 'vacancies.seed.json')))}

    # safety: never ship something the audit flagged
    for d in (HOUSING, WORK):
        for vid, ids in d.items():
            assert MATCHES[vid][1], vid
            for i in ids:
                x = inv[i]
                assert x['category'] in ('housing', 'work') and not x.get('dup_of'), i
                assert not (x.get('former_employee') or {}).get('present'), i
                assert 'PERSONAL WORK' not in x['folder_path'].upper() and 'тимчасове' not in x['folder_path'], i
                assert len(ids) <= (8 if d is HOUSING else 4), vid
    if a.dry_run:
        for vid in vac:
            if vid in HOUSING or vid in WORK or vid in VIDEOS:
                print(vid, len(HOUSING.get(vid, [])), len(WORK.get(vid, [])), VIDEOS.get(vid, []))
        return

    made = 0
    out = {}
    for vid, v in vac.items():
        entry = {}
        for key, d in (('housing', HOUSING), ('work', WORK)):
            bases = []
            for i in d.get(vid, []):
                rel = f'/media/vx/{vid}/{base_id(i)}'
                made += make_photo(os.path.join(a.drive, inv[i]['path']), os.path.join(ROOT, 'public') + rel)
                bases.append(rel)
            if bases:
                entry[key] = bases
        if entry or vid in VIDEOS:
            out[vid] = entry
    print('photos written:', made)

    # new clips
    pr = load_process_reviews()
    det = cv2.FaceDetectorYN.create(a.yunet, '', (320, 320), 0.7, 0.3, 5000)
    with tempfile.TemporaryDirectory() as tmp:
        for name, (drive_id, kind, *rest) in NEW_CLIPS.items():
            dst = os.path.join(VIDEO_DIR, name + '.mp4')
            if os.path.exists(dst):
                continue
            src = os.path.join(tmp, name + os.path.splitext(inv[drive_id]['path'])[1].lower())
            os.symlink(os.path.join(a.drive, inv[drive_id]['path']), src)
            outd = os.path.join(tmp, 'out')
            os.makedirs(outd, exist_ok=True)
            if kind == 'review':
                subprocess.run(['python3', os.path.join(HERE, 'process_reviews.py'), a.yunet, outd, src], check=True)
            else:
                housing_cover(pr, src, det, os.path.join(outd, name), rest[3] if len(rest) > 3 else None)
                pr.burn(src, os.path.join(outd, name + '.mp4'))
            for suf in ('.mp4', '-cover-480.webp', '-cover-800.webp'):
                f = os.path.join(VIDEO_DIR, name + suf)
                assert not os.path.exists(f), f
                shutil.copy2(os.path.join(outd, name + suf), f)
            print('clip', name)

    meta = {k: {'name': n, 'uk': uk, 'ru': ru, 'kind': 'review'} for k, (n, uk, ru) in EXISTING.items()}
    meta.update({k: {'name': v[2], 'uk': v[3], 'ru': v[4], 'kind': v[1]} for k, v in NEW_CLIPS.items()})
    for vid, names in VIDEOS.items():
        out.setdefault(vid, {})['videos'] = [{
            'src': f'/reviews/video/{k}.mp4', 'cover': f'/reviews/video/{k}-cover-800.webp',
            'name': meta[k]['name'], 'dur': mmss(os.path.join(VIDEO_DIR, k + '.mp4')),
            'uk': meta[k]['uk'], 'ru': meta[k]['ru'], 'kind': meta[k]['kind'],
        } for k in names]
    res = {}
    for vid in vac:  # seed order
        if vid in out and out[vid]:
            e = out[vid]
            res[vac[vid]['path']] = {k: e[k] for k in ('videos', 'housing', 'work') if k in e}
    with open(OUT_JSON, 'w') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('vacancies:', len(res), '→', os.path.relpath(OUT_JSON, ROOT))


if __name__ == '__main__':
    main()
