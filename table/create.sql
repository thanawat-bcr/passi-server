# PASSPORTS
create table passports
(
    id int auto_increment,
    passport_no       varchar(128) not null,
    name              varchar(255) not null,
    surname           varchar(255) not null,
    type              varchar(128) not null,
    country_code      varchar(128) not null,
    nationality       varchar(128) not null,
    date_of_birth     date         not null,
    place_of_birth    varchar(128) not null,
    identification_no varchar(128) not null,
    sex               varchar(128) not null,
    height            varchar(128) not null,
    date_of_issue     date         not null,
    date_of_expiry    date         not null,

    check_in_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_at      TIMESTAMP,
    constraint passports_pk
        primary key (id)
);

create unique index passports_id_unique_index
    on passports (id);

# users
create table users
(
    id                  int auto_increment,
    passport            int,
    pin                 varchar(256),
    email               varchar(256) not null,
    password            varchar(256) not null,
    constraint users_pk
        primary key (id),
    FOREIGN KEY (passport) REFERENCES passports(id)
);

create unique index users_id_unique_index
    on users (id);
create unique index users_passport_unique_index
    on users (passport);
create unique index users_email_unique_index
    on users (email);


