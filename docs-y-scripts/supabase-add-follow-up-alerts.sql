-- ============================================
-- ALERTAS FOLLOW-UP: fecha envío y flags de webhook
-- ============================================

-- Fecha en que la propuesta se envió (se rellena al pasar a "Propuesta Enviada")
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS fecha_envio_propuesta TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN presupuestos.fecha_envio_propuesta IS 'Fecha en que la propuesta se envió al cliente (estado Propuesta Enviada). Base para alerta a 15 días.';

-- Para no spamear el webhook: última vez que se envió alerta "15 días sin follow-up"
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS webhook_15d_sent_at TIMESTAMP WITH TIME ZONE;

-- Última vez que se envió alerta "fecha follow-up futuro vencida"
ALTER TABLE presupuestos
ADD COLUMN IF NOT EXISTS webhook_future_fu_sent_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN presupuestos.webhook_15d_sent_at IS 'Última vez que se envió webhook por propuesta con 15+ días sin follow-up';
COMMENT ON COLUMN presupuestos.webhook_future_fu_sent_at IS 'Última vez que se envió webhook por fecha follow-up futuro vencida';
