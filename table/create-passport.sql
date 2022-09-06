create table passport
(
    passport_no VARCHAR(128) not null,
    name                VARCHAR(255) not null,
    surname             VARCHAR(255) not null,
    type                VARCHAR(128) not null,
    country_code        VARCHAR(128) not null,
    nationality         VARCHAR(128) not null,
    date_of_birth       VARCHAR(128) not null,
    place_of_birth      VARCHAR(128) not null,
    identification_no   VARCHAR(128) not null,
    sex                 VARCHAR(128) not null,
    height              VARCHAR(128) not null,
    date_of_issue       VARCHAR(128) not null,
    date_of_expiry      VARCHAR(128) not null,
    constraint passport_pk
        primary key (passport_no)
);

create unique index passport_passport_no_uindex
    on passport (passport_no);