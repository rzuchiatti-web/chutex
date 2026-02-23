import http.server
import os
import sys

DIST = '/app/frontend/dist'

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]

        # API proxy - should not reach here (nginx handles it)
        if path.startswith('/api'):
            self.send_error(502)
            return

        # Try exact file
        file_path = os.path.join(DIST, path.lstrip('/'))
        if os.path.isfile(file_path):
            return super().do_GET()

        # Try with .html
        html_path = file_path.rstrip('/') + '.html'
        if os.path.isfile(html_path):
            self.path = path.rstrip('/') + '.html'
            return super().do_GET()

        # Try index.html in directory
        index_path = os.path.join(file_path, 'index.html')
        if os.path.isdir(file_path) and os.path.isfile(index_path):
            self.path = path.rstrip('/') + '/index.html'
            return super().do_GET()

        # For (tabs) routes - check the (tabs) directory
        if path.startswith('/'):
            tabs_path = os.path.join(DIST, '(tabs)', path.lstrip('/') + '.html')
            if os.path.isfile(tabs_path):
                self.path = '/(tabs)' + path + '.html'
                return super().do_GET()

        # Fallback to index.html for SPA
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, format, *args):
        pass  # Silence logs

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    server = http.server.HTTPServer(('0.0.0.0', port), SPAHandler)
    print(f'SPA server on port {port}')
    server.serve_forever()
