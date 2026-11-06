#!/usr/bin/env python3
"""
server.py
─────────────────────────────────────────────────────────────────
Lightweight development server for the Audit Management System.
Serves the app/ directory on http://localhost:8080

Usage:
    python3 server.py          # default port 8080
    python3 server.py 3000     # custom port

No dependencies — uses only Python 3 stdlib.
─────────────────────────────────────────────────────────────────
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading

# ── Config ────────────────────────────────────────────────────
PORT     = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
APP_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

# ── Custom handler ────────────────────────────────────────────
class AMSHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        # Serve files from the app/ subdirectory
        super().__init__(*args, directory=APP_DIR, **kwargs)

    def log_message(self, format, *args):
        # Cleaner log output
        status = args[1] if len(args) > 1 else "-"
        raw    = args[0] if len(args) > 0 else ""
        path   = raw.split(" ")[1] if " " in raw else raw
        # Suppress favicon noise
        if "favicon" in path:
            return
        color = "\033[92m" if str(status).startswith("2") else "\033[93m" if str(status).startswith("3") else "\033[91m"
        reset = "\033[0m"
        print(f"  {color}{status}{reset}  {path}")

    def end_headers(self):
        # Allow localStorage + sessionStorage to work (same-origin)
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

# ── Main ──────────────────────────────────────────────────────
def main():
    url = f"http://localhost:{PORT}"

    # Allow address reuse so you can restart quickly
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", PORT), AMSHandler) as httpd:
        print()
        print("  ┌─────────────────────────────────────────────┐")
        print("  │        Audit Management System              │")
        print("  │        Development Server                   │")
        print("  ├─────────────────────────────────────────────┤")
        print(f"  │  ✅  Serving:  {url:<29} │")
        print(f"  │  📁  Root:     app/                         │")
        print(f"  │                                             │")
        print(f"  │  Press Ctrl+C to stop                       │")
        print("  └─────────────────────────────────────────────┘")
        print()

        # Open browser automatically after a short delay
        def open_browser():
            import time
            time.sleep(0.5)
            webbrowser.open(url)

        threading.Thread(target=open_browser, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n  🛑  Server stopped.\n")

if __name__ == "__main__":
    main()
