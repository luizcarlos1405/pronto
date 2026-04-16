{
  pkgs ? import <nixpkgs> { },
}:

let
  playwrightLibs = with pkgs; [
    alsa-lib
    at-spi2-atk
    at-spi2-core
    atk
    cairo
    cups
    dbus
    expat
    fontconfig
    gdk-pixbuf
    glib
    gtk3
    libdrm
    libffi
    libgbm
    libGL
    libxkbcommon
    libX11
    libxcb
    libXcomposite
    libXdamage
    libXext
    libXfixes
    libXrandr
    libxshmfence
    mesa
    nspr
    nss
    pango
    systemd
    wayland
    xcbutil
    xcbutilcursor
    xcbutilimage
    xcbutilkeysyms
    xcbutilrenderutil
    xcbutilwm
  ];
in

pkgs.mkShell {
  packages = [ ];

  shellHook = ''
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath playwrightLibs}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  '';
}
