# QR Code

Scan qr code from `PASSI TOURIST APPLICATION` and verify their qr code.

**URL** : `/verify/qr/`

**Method** : `POST`

**Auth required** : NO

**Data constraints**

```json
{
    "token": "[Token from tourist's qrcode]"
}
```

**Data example**

```json
{
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQsImlhdCI6MTY2NzAzOTQ0MCwiZXhwIjoxNjY3MDM5NTAwfQ.nvjQ8weoXtS8duzHCBh8KTccBInmtbwmuZhwPC7tfnE"
}
```

## Success Response

**Code** : `200 OK`

**Content example**

You must use this `token` for next step of `Two-Factor Authentication`, we also provided `timer` to ensure that tourist can confirm their identity within 1 minute or 60 seconds.

```json
{
    "status": "SUCCESS",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQsImlhdCI6MTY2NzAzOTQ0MCwiZXhwIjoxNjY3MDM5NTAwfQ.nvjQ8weoXtS8duzHCBh8KTccBInmtbwmuZhwPC7tfnE",
	"timer": 60
}
```

## Error Response

**Condition** : If 'token' is not provided.

**Code** : `403 Forbidden`

**Content** :

```json
{
    "status": "TOKEN_IS_REQUIRED"
}
```

**Condition** : If 'token' is invalid.

**Code** : `401 Unauthorized`

**Content** :

```json
{
    "status": "TOKEN_IS_INVALID"
}
```

**Condition** : Other cases

**Code** : `400 bad Request`

**Content** :

```json
{
    "status": "SOMETHING_WENT_WRONG"
}
```