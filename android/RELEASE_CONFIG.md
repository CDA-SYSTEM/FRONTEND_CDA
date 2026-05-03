# Configuración de Release - CDA Putumayo Frontend

## 1. Generar Keystore para Firma

Ejecuta este comando **una sola vez** en la raíz de `android/`:

```powershell
mkdir keystore
keytool -genkey -v -keystore keystore/cda_release_key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cda_key
```

**Parámetros solicitados:**
- Contraseña del almacén: `tu_contrasena_segura`
- Nombre y apellido: `CDA Putumayo Generator`
- Unidad organizativa: `CDA`
- Organización: `Centro Diagnóstico Automotor`
- Ciudad: `Mocoa`
- Provincia: `Putumayo`
- País: `CO`
- Alias clave: `cda_key`
- Contraseña clave: `tu_contrasena_segura`

**Guardar las credenciales en un lugar seguro.**

---

## 2. Configurar Variables de Entorno

Para no exponer contraseñas en versionamiento, agrega al archivo `.env`:

```
KEYSTORE_PASSWORD=tu_contrasena_segura
KEY_ALIAS=cda_key
KEY_PASSWORD=tu_contrasena_segura
```

**Nota:** El archivo `build.gradle` ya lee estas variables con `System.getenv()`.

---

## 3. Ícono Personalizado

### Generar Assets desde Android Studio:

1. Abre Android Studio.
2. Ve a **File > New > Image Asset**.
3. Selecciona tipo de imagen: **App Icon**.
4. Sube tu imagen (recomendado: 512x512 PNG).
5. Elige carpeta de salida: **src/main/res/mipmap** (ya debe estar seleccionada).
6. Haz clic en **Finish**.

Esto genera automáticamente archivos en:
- `mipmap-mdpi/ic_launcher.png`
- `mipmap-hdpi/ic_launcher.png`
- `mipmap-xhdpi/ic_launcher.png`
- `mipmap-xxhdpi/ic_launcher.png`
- `mipmap-xxxhdpi/ic_launcher.png`

**O manualmente:** Copia tus imágenes PNG preprocesadas a cada carpeta `mipmap-*`.

---

## 4. Splash Screen Personalizado

### Opción A: Usando Capacitor Splash Screen (Recomendado)

Actualiza `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.cda.putumayo.frontend',
  appName: 'Frontend CDA Putumayo',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#155DFC',
      androidScaleType: 'CENTER_CROP',
      androidSpinnerStyle: 'large',
      spinnerColor: '#fff'
    }
  }
};
```

### Opción B: Customizar drawable del splash

Crea un archivo `splash.xml` en `android/app/src/main/res/drawable/`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Fondo azul -->
    <item android:drawable="@color/splash_background" />
    
    <!-- Logo centrado -->
    <item
        android:drawable="@mipmap/ic_launcher"
        android:gravity="center" />
</layer-list>
```

Agrega el color en `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#155DFC</color>
</resources>
```

Referencia el splash en `styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="android:background">@drawable/splash</item>
</style>
```

---

## 5. Permisos en AndroidManifest

Ya están agregados:
- `INTERNET` (navegación web)
- `CAMERA` (evidencia fotográfica)
- `ACCESS_FINE_LOCATION` (geolocalización)
- `ACCESS_COARSE_LOCATION` (ubicación aproximada)
- `POST_NOTIFICATIONS` (notificaciones)

**Nota:** En Android 12+, algunos permisos requieren contexto de uso en la privacidad. Verifica que tu app declara el propósito en Google Play Console.

---

## 6. Versión de Release

Actualiza en `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2        // Incremental por cada release
    versionName "1.1.0"  // Semántico: Mayor.Menor.Patch
}
```

---

## 7. Compilar APK Release

```bash
# Una sola vez: reemplazar contraseñas
$env:KEYSTORE_PASSWORD = "tu_contrasena_segura"
$env:KEY_ALIAS = "cda_key"
$env:KEY_PASSWORD = "tu_contrasena_segura"

# Compilar APK
npm run build
npm run android:sync
cd android
gradlew assembleRelease

# Resultado: android/app/build/outputs/apk/release/app-release.apk
```

---

## 8. Compilar AAB (Android App Bundle) para Play Store

```bash
cd android
gradlew bundleRelease

# Resultado: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 9. Verificar Firma

```bash
# Verificar APK
jarsigner -verify -verbose android/app/build/outputs/apk/release/app-release.apk

# Verificar certificado
keytool -list -v -keystore keystore/cda_release_key.jks
```

---

## 10. Checklist Pre-Release

- [ ] `versionCode` e `versionName` actualizados.
- [ ] Permisos en `AndroidManifest.xml` confirmados.
- [ ] Ícono en `mipmap-*` actualizado.
- [ ] Splash configurado (opcional pero recomendado).
- [ ] Keystore generado y en `android/keystore/`.
- [ ] Variables de entorno configuradas.
- [ ] Prueba en emulador con `npm run android:open`.
- [ ] Build de APK exitoso sin errores.
- [ ] APK testeable en dispositivo.

---

## Notas de Seguridad

1. **Nunca** commits keystore a git; ya está en `.gitignore`.
2. **Guarda keystore** como backup en lugar seguro (tu máquina, no cloud público).
3. **Contraseña**: Usa caracteres especiales y +8 caracteres.
4. **Renovación**: El certificado es válido por 10000 días (~27 años).

---

## Troubleshooting

### Error: "Keystore not found"
Verifica ruta en `build.gradle` coincida con carpeta `android/keystore/cda_release_key.jks`.

### Error: "Invalid password"
Asegúrate variables de entorno estén correctas:
```powershell
echo $env:KEYSTORE_PASSWORD
```

### Error: "keyAlias does NOT exist"
Regenera keystore con alias exacto: `cda_key`.

### APK compilado pero no firmado
Confirma `signingConfig signingConfigs.release` aplicado al build type `release` en `build.gradle`.
