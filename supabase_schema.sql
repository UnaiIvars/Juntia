-- ==============================================================================
-- JUNTIA — ESQUEMA DE BASE DE DATOS SUPABASE (EN ESPAÑOL)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS PERSONALIZADOS (ENUMS)
DO $$ BEGIN
    CREATE TYPE estado_plan AS ENUM ('borrador', 'votando', 'confirmado', 'archivado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rol_miembro AS ENUM ('administrador', 'miembro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE PERFILES (Extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nombre_completo TEXT,
    avatar_url TEXT,
    bio TEXT,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE LUGARES (Catálogo y lugares sugeridos)
CREATE TABLE IF NOT EXISTS public.lugares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_externo TEXT, -- ID de Mapbox / Google / OpenStreetMap
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    nivel_precio INT DEFAULT 2, -- 1: Barato, 2: Medio, 3: Caro, 4: Muy caro
    coste_estimado_por_persona NUMERIC(10, 2) DEFAULT 20.00,
    direccion TEXT,
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    telefono TEXT,
    sitio_web TEXT,
    fotos TEXT[] DEFAULT '{}',
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA DE PLANES
CREATE TABLE IF NOT EXISTS public.planes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    tipo_plan TEXT DEFAULT 'cena' NOT NULL, -- 'cena', 'fiesta', 'deporte', 'cafe', 'viaje', 'otro'
    fecha DATE,
    presupuesto_maximo NUMERIC(10, 2) DEFAULT 30.00,
    distancia_maxima NUMERIC(5, 2) DEFAULT 10.00,
    creador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    codigo_invitacion TEXT UNIQUE NOT NULL,
    estado estado_plan DEFAULT 'borrador' NOT NULL,
    lugar_confirmado_id UUID REFERENCES public.lugares(id) ON DELETE SET NULL,
    fecha_confirmada TIMESTAMPTZ,
    fecha_inicio_objetivo DATE,
    fecha_fin_objetivo DATE,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA DE MIEMBROS DEL PLAN
CREATE TABLE IF NOT EXISTS public.miembros_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    rol rol_miembro DEFAULT 'miembro' NOT NULL,
    preferencias_completadas BOOLEAN DEFAULT false NOT NULL,
    unido_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, usuario_id)
);

-- 7. TABLA DE DISPONIBILIDAD
CREATE TABLE IF NOT EXISTS public.disponibilidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME DEFAULT '19:00',
    hora_fin TIME DEFAULT '23:00',
    esta_disponible BOOLEAN DEFAULT true NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLA DE PREFERENCIAS
CREATE TABLE IF NOT EXISTS public.preferencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    miembro_id UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE UNIQUE,
    presupuesto_maximo NUMERIC(10, 2) DEFAULT 30.00 NOT NULL,
    categorias_preferidas TEXT[] DEFAULT '{}' NOT NULL,
    distancia_maxima_km NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
    latitud_usuario DOUBLE PRECISION,
    longitud_usuario DOUBLE PRECISION,
    restricciones_dieteticas TEXT[] DEFAULT '{}',
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLA DE LUGARES CANDIDATOS EN EL PLAN
CREATE TABLE IF NOT EXISTS public.lugares_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
    lugar_id UUID NOT NULL REFERENCES public.lugares(id) ON DELETE CASCADE,
    propuesto_por UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE,
    puntuacion_compatibilidad NUMERIC(5, 2) DEFAULT 0.00,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(plan_id, lugar_id)
);

-- 10. TABLA DE VOTOS
CREATE TABLE IF NOT EXISTS public.votos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lugar_plan_id UUID NOT NULL REFERENCES public.lugares_plan(id) ON DELETE CASCADE,
    miembro_id UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE,
    valor_voto INT NOT NULL CHECK (valor_voto IN (-1, 0, 1)), -- -1: No me gusta, 0: Neutral, 1: Sí / Me encanta
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(lugar_plan_id, miembro_id)
);

-- 11. TABLA DE MENSAJES (CHAT DEL PLAN)
CREATE TABLE IF NOT EXISTS public.mensajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
    miembro_id UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABLA DE GASTOS COMPARTIDOS
CREATE TABLE IF NOT EXISTS public.gastos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
    pagado_por UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. TABLA DE PARTICIPANTES EN EL GASTO
CREATE TABLE IF NOT EXISTS public.participantes_gasto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gasto_id UUID NOT NULL REFERENCES public.gastos(id) ON DELETE CASCADE,
    miembro_id UUID NOT NULL REFERENCES public.miembros_plan(id) ON DELETE CASCADE,
    monto_cuota NUMERIC(10, 2) NOT NULL,
    esta_liquidado BOOLEAN DEFAULT false NOT NULL,
    UNIQUE(gasto_id, miembro_id)
);

-- 14. TABLA DE NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    cuerpo TEXT NOT NULL,
    enlace TEXT,
    leida BOOLEAN DEFAULT false NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. TABLA DE FOTOS DEL PLAN
CREATE TABLE IF NOT EXISTS public.fotos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
    subido_por UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL,
    pie_de_foto TEXT,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. TABLA DE VALORACIONES DE LUGARES
CREATE TABLE IF NOT EXISTS public.valoraciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lugar_id UUID NOT NULL REFERENCES public.lugares(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    puntuacion INT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
    comentario TEXT,
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lugares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lugares_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valoraciones ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFILES
CREATE POLICY "Perfiles visibles para usuarios autenticados"
    ON public.perfiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.perfiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trigger para creación automática de perfil al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.manejar_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, username, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'nombre_completo', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'username',
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        nombre_completo = EXCLUDED.nombre_completo,
        username = COALESCE(EXCLUDED.username, perfiles.username),
        avatar_url = COALESCE(EXCLUDED.avatar_url, perfiles.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.manejar_nuevo_usuario();

-- ==============================================================================
-- FUNCIONES AUXILIARES DE SEGURIDAD (Bypass RLS para evitar recursión)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.usuario_es_miembro_del_plan(p_plan_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.miembros_plan
        WHERE plan_id = p_plan_id AND usuario_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.usuario_es_creador_del_plan(p_plan_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.planes
        WHERE id = p_plan_id AND creador_id = p_user_id
    );
$$;

-- ==============================================================================
-- POLÍTICAS RLS ROBUSTAS
-- ==============================================================================

-- Políticas para PLANES
CREATE POLICY "Ver planes propios o donde eres miembro"
    ON public.planes FOR SELECT TO authenticated
    USING (
        creador_id = auth.uid() OR
        public.usuario_es_miembro_del_plan(id, auth.uid()) OR
        codigo_invitacion IS NOT NULL
    );

CREATE POLICY "Usuarios autenticados pueden crear planes"
    ON public.planes FOR INSERT TO authenticated
    WITH CHECK (creador_id = auth.uid());

CREATE POLICY "Creadores de planes pueden editar sus planes"
    ON public.planes FOR UPDATE TO authenticated
    USING (creador_id = auth.uid());

CREATE POLICY "Creadores de planes pueden eliminar sus planes"
    ON public.planes FOR DELETE TO authenticated
    USING (creador_id = auth.uid());

-- Políticas para LUGARES
CREATE POLICY "Lugares visibles para todos los autenticados"
    ON public.lugares FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar lugares"
    ON public.lugares FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para MIEMBROS_PLAN
CREATE POLICY "Ver miembros de tus planes"
    ON public.miembros_plan FOR SELECT TO authenticated
    USING (
        usuario_id = auth.uid() OR
        public.usuario_es_creador_del_plan(plan_id, auth.uid()) OR
        public.usuario_es_miembro_del_plan(plan_id, auth.uid())
    );

CREATE POLICY "Unirse o añadir miembros a planes"
    ON public.miembros_plan FOR INSERT TO authenticated
    WITH CHECK (
        usuario_id = auth.uid() OR
        public.usuario_es_creador_del_plan(plan_id, auth.uid())
    );

CREATE POLICY "Miembros pueden abandonar el plan"
    ON public.miembros_plan FOR DELETE TO authenticated
    USING (usuario_id = auth.uid());

-- Políticas para MENSAJES (Chat)
CREATE POLICY "Participantes pueden ver y enviar mensajes del plan"
    ON public.mensajes FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.plan_id = mensajes.plan_id
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

-- Políticas para VOTOS
CREATE POLICY "Participantes pueden votar en lugares del plan"
    ON public.votos FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = votos.miembro_id
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

-- Políticas para DISPONIBILIDAD
CREATE POLICY "Ver disponibilidad de miembros en tus planes"
    ON public.disponibilidad FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = disponibilidad.miembro_id
            AND (
                miembros_plan.usuario_id = auth.uid() OR
                public.usuario_es_creador_del_plan(miembros_plan.plan_id, auth.uid()) OR
                public.usuario_es_miembro_del_plan(miembros_plan.plan_id, auth.uid())
            )
        )
    );

CREATE POLICY "Gestionar tu propia disponibilidad"
    ON public.disponibilidad FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = disponibilidad.miembro_id
            AND miembros_plan.usuario_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = disponibilidad.miembro_id
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

-- ==============================================================================
-- BUCKET DE STORAGE PARA AVATARES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Avatares públicos para lectura"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Usuarios pueden subir su propio avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Usuarios pueden actualizar su avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars');

-- ==============================================================================
-- SISTEMA DE AMIGOS Y USERNAME ÚNICO
-- ==============================================================================

-- Columnas adicionales en perfiles
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS cambios_nombre_mes INT DEFAULT 0;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS fecha_ultimo_cambio_nombre TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_perfiles_username ON public.perfiles (username);

-- Tabla de Amistades
CREATE TABLE IF NOT EXISTS public.amistades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitante_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    receptor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT no_auto_amistad CHECK (solicitante_id <> receptor_id),
    CONSTRAINT unica_amistad UNIQUE (
        LEAST(solicitante_id::text, receptor_id::text),
        GREATEST(solicitante_id::text, receptor_id::text)
    )
);

ALTER TABLE public.amistades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver amistades propias"
    ON public.amistades FOR SELECT TO authenticated
    USING (auth.uid() = solicitante_id OR auth.uid() = receptor_id);

CREATE POLICY "Crear solicitud de amistad"
    ON public.amistades FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Actualizar solicitud de amistad"
    ON public.amistades FOR UPDATE TO authenticated
    USING (auth.uid() = receptor_id);

CREATE POLICY "Eliminar o cancelar amistad"
    ON public.amistades FOR DELETE TO authenticated
    USING (auth.uid() = solicitante_id OR auth.uid() = receptor_id);

-- ==============================================================================
-- TABLA DE INVITACIONES A PLANES ENTRE AMIGOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.invitaciones_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
    usuario_invitado_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    invitado_por UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    creado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unica_invitacion_por_plan UNIQUE (plan_id, usuario_invitado_id)
);

ALTER TABLE public.invitaciones_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver invitaciones recibidas o enviadas"
    ON public.invitaciones_plan FOR SELECT TO authenticated
    USING (auth.uid() = usuario_invitado_id OR auth.uid() = invitado_por);

CREATE POLICY "Crear invitaciones de plan"
    ON public.invitaciones_plan FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = invitado_por);

CREATE POLICY "Responder invitacion"
    ON public.invitaciones_plan FOR UPDATE TO authenticated
    USING (auth.uid() = usuario_invitado_id);

CREATE POLICY "Eliminar invitacion"
    ON public.invitaciones_plan FOR DELETE TO authenticated
    USING (auth.uid() = usuario_invitado_id OR auth.uid() = invitado_por);

-- ==============================================================================
-- POLÍTICAS PARA LUGARES_PLAN
-- ==============================================================================
CREATE POLICY "Lugares de planes visibles para participantes"
    ON public.lugares_plan FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.plan_id = lugares_plan.plan_id
            AND miembros_plan.usuario_id = auth.uid()
        )
        OR public.usuario_es_creador_del_plan(plan_id, auth.uid())
        OR public.usuario_es_miembro_del_plan(plan_id, auth.uid())
    );

CREATE POLICY "Participantes o creadores pueden añadir lugares"
    ON public.lugares_plan FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.plan_id = lugares_plan.plan_id
            AND miembros_plan.usuario_id = auth.uid()
        )
        OR public.usuario_es_creador_del_plan(plan_id, auth.uid())
    );

CREATE POLICY "Creadores del plan pueden editar lugares propuestos"
    ON public.lugares_plan FOR UPDATE TO authenticated
    USING (
        public.usuario_es_creador_del_plan(plan_id, auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = lugares_plan.propuesto_por
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Creadores o proponentes pueden eliminar lugares"
    ON public.lugares_plan FOR DELETE TO authenticated
    USING (
        public.usuario_es_creador_del_plan(plan_id, auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = lugares_plan.propuesto_por
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

-- ==============================================================================
-- POLÍTICAS PARA GASTOS Y PARTICIPANTES_GASTO
-- ==============================================================================
CREATE POLICY "Participantes pueden ver gastos del plan"
    ON public.gastos FOR SELECT TO authenticated
    USING (public.usuario_es_miembro_del_plan(plan_id, auth.uid()));

CREATE POLICY "Participantes pueden registrar gastos"
    ON public.gastos FOR INSERT TO authenticated
    WITH CHECK (public.usuario_es_miembro_del_plan(plan_id, auth.uid()));

CREATE POLICY "Pagador puede editar su gasto"
    ON public.gastos FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = gastos.pagado_por
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Pagador puede eliminar su gasto"
    ON public.gastos FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_plan
            WHERE miembros_plan.id = gastos.pagado_por
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

CREATE POLICY "Participantes pueden ver cuotas de gasto"
    ON public.participantes_gasto FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.gastos
            JOIN public.miembros_plan ON miembros_plan.plan_id = gastos.plan_id
            WHERE gastos.id = participantes_gasto.gasto_id
            AND miembros_plan.usuario_id = auth.uid()
        )
    );

-- ==============================================================================
-- HABILITAR REALTIME
-- ==============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;



