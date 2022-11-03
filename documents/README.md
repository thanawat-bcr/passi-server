# Passi Business API Docs

Currently, our API is an open endpoints which require no Authentication.
To complete the verification process, 
1. you need to do a `QR verification` to get `TOKEN` for next verification step
2. followed by any of `Two-Factor Authentication`, which we provided boths of `PIN` and `FACE`

## Endpoints for QR Code verification

You need to complete this `QR Verification` before going to `Two-Factor Authentication` step.

* [Verify QR](verify/qr.md) : `POST /verify/qr/`

You will get `TOKEN` after verification success for next step verification.

## Endpoints for Two-Factor Authentication

There are 2 endpoints available here, you can choose either one.
These endpoints are required return `TOKEN` from `QR Code verification` in previous step.

* [Verify PIN](verify/pin.md) : `POST /verify/pin/`
* [Verify Face](verify/face.md) : `POST /verify/face/`
