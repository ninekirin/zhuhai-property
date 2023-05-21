# -*- encoding: utf-8 -*-

import os
from api import app, db


@app.shell_context_processor
def make_shell_context():
    return {"app": app, "db": db}


if __name__ == '__main__':
    # from waitress import serve
    # serve(app, host="0.0.0.0", port=os.getenv('PORT', 8000))
    app.run(debug=True, host="0.0.0.0", port=os.getenv('PORT', 8000))
