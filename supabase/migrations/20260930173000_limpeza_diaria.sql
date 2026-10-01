-- Limpeza diária de tabelas auxiliares (cotações de frete e log anti-abuso de e-mails).
select cron.schedule('bodyoga-limpeza-diaria', '41 4 * * *', $$
  delete from public.shipping_quotes where created_at < now() - interval '2 days';
  delete from public.notification_log where created_at < now() - interval '7 days';
  delete from net._http_response where created < now() - interval '7 days';
$$);
