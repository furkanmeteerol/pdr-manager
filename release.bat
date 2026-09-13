@echo off
setlocal enabledelayedexpansion

:: Dinamik olarak package.json'dan mevcut surumu oku
for /f "tokens=*" %%v in ('node -p "require('./package.json').version"') do (
  set "CURRENT_VERSION=%%v"
)

if "%CURRENT_VERSION%"=="" (
  echo HATA: package.json icinden versiyon numarasi okunamadi!
  pause
  exit /b 1
)

:: Surumu parcala: MAJOR.MINOR.PATCH
for /f "tokens=1,2,3 delims=." %%a in ("%CURRENT_VERSION%") do (
  set "MAJOR=%%a"
  set "MINOR=%%b"
  set "PATCH=%%c"
)

set /a NEXT_PATCH_VAL=PATCH+1
set /a NEXT_MINOR_VAL=MINOR+1
set /a NEXT_MAJOR_VAL=MAJOR+1

set "PATCH_VERSION=%MAJOR%.%MINOR%.!NEXT_PATCH_VAL!"
set "MINOR_VERSION=%MAJOR%.!NEXT_MINOR_VAL!.0"
set "MAJOR_VERSION=!NEXT_MAJOR_VAL!.0.0"

echo ========================================
echo        PDR Manager Release
echo ========================================
echo.
echo Mevcut versiyon : v%CURRENT_VERSION%
echo.
echo 1 - Patch  (%CURRENT_VERSION% -^> %PATCH_VERSION%)
echo 2 - Minor  (%CURRENT_VERSION% -^> %MINOR_VERSION%)
echo 3 - Major  (%CURRENT_VERSION% -^> %MAJOR_VERSION%)
echo 4 - Manuel versiyon gir
echo.
set /p "CHOICE=Secimin: "

if "%CHOICE%"=="1" (
  set "NEW_VERSION=%PATCH_VERSION%"
) else if "%CHOICE%"=="2" (
  set "NEW_VERSION=%MINOR_VERSION%"
) else if "%CHOICE%"=="3" (
  set "NEW_VERSION=%MAJOR_VERSION%"
) else if "%CHOICE%"=="4" (
  echo.
  set /p "NEW_VERSION=Yeni versiyon numarasini girin (orn: 1.0.6): "
) else (
  echo.
  echo Gecersiz secim yapildi. Islem iptal edildi.
  pause
  exit /b 1
)

if "%NEW_VERSION%"=="" (
  echo.
  echo Gecersiz versiyon girildi. Islem iptal edildi.
  pause
  exit /b 1
)

echo.
echo v%CURRENT_VERSION% -^> v%NEW_VERSION%
echo.
set /p "CONFIRM=Devam edilsin mi? (E/H): "

if /i not "%CONFIRM%"=="E" (
  echo.
  echo Release islemi kullanici tarafindan iptal edildi.
  pause
  exit /b 0
)

echo.
echo [1/6] package.json surumu guncelleniyor...
call npm version %NEW_VERSION% --no-git-tag-version
if errorlevel 1 (
  echo HATA: npm version komutu basarisiz oldu!
  goto ERROR
)

echo.
echo [2/6] Degisiklikler git staging alanina ekleniyor...
git add .
if errorlevel 1 (
  echo HATA: git add komutu basarisiz oldu!
  goto ERROR
)

echo.
echo [3/6] Release commit olusturuluyor...
git commit -m "release: v%NEW_VERSION%"
if errorlevel 1 (
  echo HATA: git commit komutu basarisiz oldu!
  goto ERROR
)

echo.
echo [4/6] Git tag olusturuluyor (v%NEW_VERSION%)...
git tag v%NEW_VERSION%
if errorlevel 1 (
  echo HATA: git tag komutu basarisiz oldu!
  goto ERROR
)

echo.
echo [5/6] Main branch push ediliyor...
git push origin main
if errorlevel 1 (
  echo HATA: git push origin main basarisiz oldu!
  goto ERROR
)

echo.
echo [6/6] Tag push ediliyor (v%NEW_VERSION%)...
git push origin v%NEW_VERSION%
if errorlevel 1 (
  echo HATA: git push origin v%NEW_VERSION% basarisiz oldu!
  goto ERROR
)

echo.
echo ========================================
echo RELEASE BASARIYLA TAMAMLANDI
echo ========================================
echo.
echo v%NEW_VERSION%
echo.
echo GitHub Actions release workflow'u baslatilmis olmali.
echo.
pause
exit /b 0

:ERROR
echo.
echo ========================================
echo HATA: RELEASE ISLEMI BASARISIZ OLDU!
echo ========================================
echo.
pause
exit /b 1