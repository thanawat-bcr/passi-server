# Face: Two-Factor Authentication

Tourist must do `Face Verification` along with `token` from `QR Verification API` to confirm their identity

**URL** : `/verify/face/`

**Method** : `POST`

**Auth required** : NO

**Data constraints**


***Make sure you send in `Form Data / Multipart`***
```json
{
  "token": "[Token from qr verification return response]",
  "image": "[Tourist's face image]"
}
```

**Data example**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQsImlhdCI6MTY2NzAzOTQ0MCwiZXhwIjoxNjY3MDM5NTAwfQ.nvjQ8weoXtS8duzHCBh8KTccBInmtbwmuZhwPC7tfnE",
  "image": "[Tourist's face image]"
}
```

## Success Response

**Code** : `200 OK`

**Content example**

The verification process is completed, API will return some of tourist's passport information in response

```json
{
  "status": "SUCCESS",
  "user": {
    "passport": "PASSI0001",
    "name": "Firstname Surname",
    "dob": "Jan 01 1970",
    "similarity": 0.89
  }
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

**Condition** : If some fields are missing

**Code** : `400 Bad Request`

**Content** :

```json
{
  "status": "FIELDS_ARE_REQUIRED"
}
```

**Condition** : If there is no user in system

**Code** : `404 Not Found`

**Content** :

```json
{
  "status": "USER_NOT_FOUND"
}
```

**Condition** : If Face is not matched

**Code** : `400 bad Request`

**Content** :

```json
{
  "status": "FACE_NOT_MATCHED"
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