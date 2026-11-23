# Local test server for docs/ (python tools/devserver.py [port]).
# Like `python -m http.server`, but tells browsers never to keep copies, so a phone on the home
# network always gets the newest files (with the plain server it kept running yesterday's JS).
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def send_head(self):
        # never answer "304 Not Modified": always send the file itself
        for h in ('If-Modified-Since', 'If-None-Match'):
            if h in self.headers:
                del self.headers[h]
        return super().send_head()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
root = Path(__file__).resolve().parent.parent / 'docs'
ThreadingHTTPServer(('', port), partial(NoCache, directory=str(root))).serve_forever()
