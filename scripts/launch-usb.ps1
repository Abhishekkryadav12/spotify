$ErrorActionPreference = "Stop"
$adb = "C:\Users\ADMIN\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"

Write-Host "Checking connected USB Android devices..."
& $adb devices

Write-Host "Setting USB reverse port tunnels..."
& $adb reverse tcp:8081 tcp:8081
& $adb reverse tcp:5000 tcp:5000
& $adb reverse --list

$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:ANDROID_HOME = "C:\Users\ADMIN\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe"
$env:NODE_OPTIONS = "--max-old-space-size=8192"

# Start background watchdog to re-assert reverse forwarding and launch Expo Go intent once Metro is listening
Start-Job -ScriptBlock {
    param($adbPath)
    Write-Host "[Watchdog] Waiting for Metro on port 8081..."
    for ($i = 0; $i -lt 40; $i++) {
        Start-Sleep -Seconds 1
        $listening = (netstat -ano | Select-String ":8081.*LISTENING")
        if ($listening) {
            Write-Host "[Watchdog] Metro is listening! Ensuring adb reverse and opening app on phone..."
            & $adbPath reverse tcp:8081 tcp:8081
            & $adbPath reverse tcp:5000 tcp:5000
            Start-Sleep -Milliseconds 500
            & $adbPath shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
            break
        }
    }
} -ArgumentList $adb | Out-Null

Write-Host "Starting Metro bundler with cleared cache on localhost:8081..."
npx expo start --localhost --clear
