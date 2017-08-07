UPDATE users SET last_login_at = NOW()
  WHERE email = $1;
