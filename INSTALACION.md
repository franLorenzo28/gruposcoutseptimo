# INSTRUCCIONES DE INSTALACION EN NUEVA COMPUTADORA

Este archivo contiene las instrucciones para instalar y ejecutar el proyecto en una computadora nueva.

## Prerequisitos

Antes de comenzar, asegurate de tener instalado:

1. **Node.js** (se requiere específicamente **20.20.0**) 
   - Recomendado: usar `nvm` para instalar la versión exacta:
     ```bash
     # instalar nvm (si no lo tenés)
     curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
     source ~/.nvm/nvm.sh

     # instalar y usar Node 20.20.0
     nvm install 20.20.0
     nvm use 20.20.0
     nvm alias default 20.20.0
     ```
   - Alternativa con asdf:
     ```bash
     asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
     asdf install nodejs 20.20.0
     asdf global nodejs 20.20.0
     ```
   - Verificar instalacion: `node --version` (`v20.20.0`)

   - Nota: También agregamos un archivo `.nvmrc` que define la versión del proyecto. Si usás nvm podés simplemente correr `nvm use` dentro del proyecto para seleccionar 20.20.0.

2. **Git** (opcional, pero recomendado)
   - Descargar desde: https://git-scm.com/
   - Verificar instalacion: `git --version`

3. **Docker Desktop** (solo si vas a usar Docker)
   - Descargar desde: https://www.docker.com/products/docker-desktop/
   - Verificar instalacion: `docker --version`

## Pasos de Instalacion

### 1. Copiar el proyecto

Copia toda la carpeta del pendrive a tu disco local, por ejemplo:

```
C:\Users\TuUsuario\Documents\lovable-scout-canvas
```

### 2. Abrir PowerShell / Terminal en la carpeta del proyecto

- Click derecho en la carpeta del proyecto
- Selecciona "Abrir en Terminal" o "PowerShell aqui"

> Recomendado: antes de instalar manualmente, corre el script de setup que automatiza todo:
>
> Linux / macOS:
> ```bash
> sh ./scripts/setup.sh
> ```
>
> Windows (PowerShell):
> ```powershell
> powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
> ```
>
> El script intentará instalar nvm y Node 20.20.0 (en Linux/Ubuntu) y las dependencias del proyecto, configurará Husky y ejecutará checks básicos.
### 3. Instalar dependencias del frontend

```powershell
npm install
```

Este comando puede tardar varios minutos. Descargara todas las dependencias necesarias.

### 4. Instalar dependencias del backend

```powershell
cd server
npm install
cd ..
```

### 5. Configurar variables de entorno

```powershell
# Copiar el archivo de ejemplo
copy .env.example .env

# Editar el archivo .env con tus credenciales
notepad .env
```

Configuracion minima en `.env`:

```
# Backend local (recomendado para desarrollo)
VITE_BACKEND=local

# Google Maps API Key (obtener en: https://console.cloud.google.com/)
VITE_GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# Supabase (opcional, solo si usas modo cloud)
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_key_de_supabase
```

### 6. Ejecutar el proyecto

#### Opcion A: Modo desarrollo simple (sin Docker)

```powershell
npm run dev
```

Esto abrira:

- Frontend: http://localhost:5173
- Backend: http://localhost:8080

#### Opcion B: Con Docker (requiere Docker Desktop)

```powershell
# Modo desarrollo con SQLite
.\scripts\start.ps1 dev

# Modo completo con PostgreSQL y monitoreo
.\scripts\start.ps1 full
```

## Comandos Utiles

```powershell
# Ver logs del backend
cd server
npm run dev

# Compilar para produccion
npm run build

# Detener servicios Docker
.\scripts\start.ps1 stop

# Ver estado de Docker
docker ps
```

## Estructura del Proyecto

```
lovable-scout-canvas/
├── src/              # Codigo fuente del frontend (React)
├── server/           # Codigo del backend (Node.js)
├── public/           # Archivos estaticos
├── scripts/          # Scripts de utilidad
├── docs/             # Documentacion completa
├── package.json      # Dependencias del frontend
└── .env              # Variables de entorno (crear desde .env.example)
```

## Solucion de Problemas

### Error: "npm not found"

- Instala Node.js desde https://nodejs.org/

### Error al ejecutar scripts de PowerShell

```powershell
# Cambiar politica de ejecucion
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Puerto 5173 o 8080 ya en uso

```powershell
# En Windows, buscar proceso usando el puerto
netstat -ano | findstr :5173
# Matar el proceso (reemplazar PID con el numero que aparece)
taskkill /PID <numero_pid> /F
```

### Problemas con Docker

- Asegurate de que Docker Desktop este corriendo
- Reinicia Docker Desktop
- Verifica: `docker --version`

## Documentacion Adicional

Para mas informacion, consulta:

- `docs/README.md` - Indice de toda la documentacion
- `docs/docker/QUICK_START.md` - Guia rapida de Docker
- `docs/setup/` - Guias de configuracion especificas
- `README.md` - Documentacion principal del proyecto

## Soporte

Si encuentras problemas:

1. Revisa la documentacion en la carpeta `docs/`
2. Verifica que todas las dependencias esten instaladas
3. Asegurate de que el archivo `.env` este configurado correctamente

---

**Nota**: Este proyecto fue exportado desde otra computadora. Asegurate de ejecutar
`npm install` tanto en la raiz como en la carpeta `server/` antes de iniciar el proyecto.
