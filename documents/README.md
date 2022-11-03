# Passi Business API Docs

Courrntly, our API is an open endpoints which require no Authentication.
To complete the verification process, you need to do a `QR Code verification` and followed by any of `Two-Factor Authentication`

## Endpoints for QR Code verification

Businesses can scan the tourist's QR Code inside `Passi tourist application`, and get their QR token to verify in this API endpoint as a first step.

* [Verify QR](verify/qr.md) : `POST /verify/qr/`

## Endpoints for Two-Factor Authentication

There are 2 endpoints available here, you can choose either one.
This `Two-Factor Authentication` endpoints are required return `token` from `QR Code verification` in previous step.

* [Show info](user/get.md) : `GET /api/user/`
* [Update info](user/put.md) : `PUT /api/user/`
