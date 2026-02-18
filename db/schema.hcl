schema "login" {
}

table "domain_logins" {
  schema = schema.login

  column "id" {
    type = serial
    null = false
  }

  column "user_id" {
    type = uuid
    null = false
  }

  column "domain" {
    type = varchar(255)
    null = false
  }

  column "first_login_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "last_login_at" {
    type    = timestamptz
    null    = false
    default = sql("now()")
  }

  column "login_count" {
    type    = integer
    null    = false
    default = 1
  }

  primary_key {
    columns = [column.id]
  }

  unique "domain_logins_user_domain_unique" {
    columns = [column.user_id, column.domain]
  }

  index "domain_logins_user_id_idx" {
    columns = [column.user_id]
  }

  index "domain_logins_domain_idx" {
    columns = [column.domain]
  }
}
