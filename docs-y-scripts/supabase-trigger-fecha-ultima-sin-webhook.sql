-- No actualizar fecha_ultima_actualizacion ni veces_modificado cuando solo cambian
-- webhook_15d_sent_at o webhook_future_fu_sent_at (envío de alertas follow-up).
-- Así la "fecha de última actualización" solo cambia cuando realmente se modifica la propuesta.

CREATE OR REPLACE FUNCTION update_presupuesto_timestamp()
RETURNS TRIGGER AS $$
DECLARE
    solo_webhook_cambiado BOOLEAN;
BEGIN
    NEW.updated_at = NOW();

    -- ¿Solo han cambiado los flags de webhook? (no referenciar columnas que puedan no existir en todos los esquemas)
    solo_webhook_cambiado :=
        (NEW.webhook_15d_sent_at IS DISTINCT FROM OLD.webhook_15d_sent_at
         OR NEW.webhook_future_fu_sent_at IS DISTINCT FROM OLD.webhook_future_fu_sent_at)
        AND (OLD.estado_propuesta IS NOT DISTINCT FROM NEW.estado_propuesta)
        AND (OLD.comentarios IS NOT DISTINCT FROM NEW.comentarios)
        AND (OLD.historial_modificaciones IS NOT DISTINCT FROM NEW.historial_modificaciones)
        AND (OLD.nombre_cliente IS NOT DISTINCT FROM NEW.nombre_cliente)
        AND (OLD.nombre_comercial IS NOT DISTINCT FROM NEW.nombre_comercial);

    IF solo_webhook_cambiado THEN
        NEW.fecha_ultima_actualizacion = OLD.fecha_ultima_actualizacion;
        NEW.veces_modificado = OLD.veces_modificado;
    ELSE
        NEW.fecha_ultima_actualizacion = NOW();
        IF TG_OP = 'UPDATE' THEN
            NEW.veces_modificado = COALESCE(OLD.veces_modificado, 0) + 1;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya existe; solo reemplazamos la función
-- CREATE TRIGGER trigger_update_presupuesto_timestamp ...
