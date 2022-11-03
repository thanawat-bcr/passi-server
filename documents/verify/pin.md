# Pin: Two-Factor Authentication

Tourist must enter their `6-Digits PIN` to confirm their identity

**URL** : `/verify/pin/`

**Method** : `POST`

**Auth required** : NO

**Data constraints**

```json
{
    "token": "[Token from qr verification return response]",
    "pin": "[Tourist's PIN]"
}
```

**Data example**

```json
{
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQsImlhdCI6MTY2NzAzOTQ0MCwiZXhwIjoxNjY3MDM5NTAwfQ.nvjQ8weoXtS8duzHCBh8KTccBInmtbwmuZhwPC7tfnE",
  "pin": "123456"
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
		"dob": "Jan 01 1970"
	}
}
```

## Error Response

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

**Condition** : If PIN is not matched

**Code** : `400 bad Request`

**Content** :

```json
{
    "status": "PIN_NOT_MATCHED"
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