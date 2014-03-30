# ICU UCME
### I see you! You see me!

I wanted a way to easily share my screen with the people around me. Online services require you to have good bandwidth and are not necessary. Both linux and OSX have VNC of some sort built in, so why don't we use them?

I'll tell you why, it's a pain in the ass!

ICU-UCME gives you two commands.
 - `ucme` Checks for a locally running VNC server and broadcasts connection information to the local network. In OSX just goto "Remote Management" in the "Sharing" preferences.
 - `icu` Requests locally running VNC display information from `ucme` and opens vnc to connect to it.

Install with `npm install -g icu-ucme`

That's it!