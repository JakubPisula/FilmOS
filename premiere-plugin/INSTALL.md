# Instrukcja Instalacji FilmOS Connector (Adobe Premiere Pro)

### 1. Włączenie trybu debugowania (Adobe CEP)

Aby uruchomić niepodpisaną wtyczkę lokalnie, musisz włączyć tryb `PlayerDebugMode` w rejestrze/preferencjach systemowych.

#### Windows (Uruchom PowerShell jako Administrator):
```powershell
reg add "HKCU\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

#### macOS (Terminal):
```bash
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```

*(Uwaga: Jeśli używasz starszej wersji Premiere, sprawdź wersję CSXS. Dla Premiere 2024+ używamy CSXS.12).*

---

### 2. Instalacja wtyczki (Symlink)

Wtyczka musi znajdować się w dedykowanym katalogu Adobe CEP. Najlepiej utworzyć skrót (symlink) do folderu `premiere-plugin` z tego repozytorium.

#### macOS:
```bash
sudo mkdir -p "/Library/Application Support/Adobe/CEP/extensions"
sudo ln -s "$(pwd)/premiere-plugin" "/Library/Application Support/Adobe/CEP/extensions/FilmOS_Connector"
```

#### Windows (PowerShell jako Administrator):
Zastąp `C:\ścieżka\do\repo\premiere-plugin` pełną ścieżką do folderu wtyczki.
```powershell
New-Item -ItemType SymbolicallyLink -Path "C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\FilmOS_Connector" -Target "C:\ścieżka\do\repo\premiere-plugin"
```

---

### 3. Debugowanie

Wtyczka jest skonfigurowana do debugowania na porcie **8099**.
Po uruchomieniu Adobe Premiere Pro i otwarciu panelu (`Window > Extensions > FilmOS Connector`), otwórz Chrome i wpisz:
`http://localhost:8099`

---

### 4. Konfiguracja w Panelu

1. Otwórz wtyczkę w Premiere Pro.
2. Przejdź do zakładki **Ustawienia**.
3. Wklej **Token API** wygenerowany w panelu FilmOS (Ustawienia > Tokeny API).
4. Wklej **ID Projektu** (znajdziesz go w pasku adresu przeglądarki po otwarciu projektu w FilmOS).
5. Kliknij **Zapisz konfigurację**.
