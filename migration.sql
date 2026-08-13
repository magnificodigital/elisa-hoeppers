UPDATE app_settings 
SET label = 'Ativar/Desativar Módulo de Frete', 
    description = 'Quando desativado, o cálculo de frete não será exibido no checkout.' 
WHERE key = 'me_enabled';
