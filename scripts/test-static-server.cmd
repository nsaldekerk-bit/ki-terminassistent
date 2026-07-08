@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
call "C:\Program Files\nodejs\npx.cmd" --yes serve test -l 3001
