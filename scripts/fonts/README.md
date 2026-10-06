# Montserrat subset (display font)

```bash
curl -sL "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf" -o Montserrat.ttf
fonttools varLib.instancer Montserrat.ttf wght=500:800 -o Montserrat-limited.ttf
pyftsubset Montserrat-limited.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0104-0107,U+010C-010F,U+0116-011B,U+0141-0144,U+0147-0148,U+0158-015B,U+0160-0161,U+0164-0165,U+016A-016B,U+016E-016F,U+0172-0173,U+0179-017E,U+2010-2027,U+2030,U+2039-203A,U+20AC,U+2116,U+2122,U+2190-2193,U+2212,U+0400-045F,U+0490-0491,U+02BC" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum' --flavor=woff2 \
  --output-file=src/app/_fonts/montserrat-ua.woff2
```
License: SIL Open Font License 1.1 (The Montserrat Project Authors).

# Onest subset (body font)

```bash
curl -sL "https://github.com/google/fonts/raw/main/ofl/onest/Onest%5Bwght%5D.ttf" -o Onest.ttf
fonttools varLib.instancer Onest.ttf wght=400:700 -o Onest-limited.ttf
pyftsubset Onest-limited.ttf --unicodes="<same list as above>" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum' --flavor=woff2 \
  --output-file=src/app/_fonts/onest-ua.woff2
```
License: SIL Open Font License 1.1 (The Onest Project Authors).
