


import gzip
import os
import ssl
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def is_cached(path, cache, threshold):
    """Determine if file path is already available, per cache and threshold.
    `cache` level is set by pipeline user; `threshold` by the calling function.
    See `--help` CLI output for description of `cache` levels.
    """

    if cache >= threshold:
        if threshold == 1:
            action = "download"
        elif threshold == 2:
            action = "comput"

        if os.path.exists(path):
            print(f"Using cached copy of {action}ed file {path}")
            return True
        else:
            print(f"No cached copy exists, so {action}ing {path}")
            return False
    return False

def download_gzip(url, output_path, cache=0):
    """Download gzip file, decompress, write to output path; use optional cache
    Cached files can help speed development iterations by > 2x, and some
    development scenarios (e.g. on a train or otherwise without an Internet
    connection) can be impossible without it.
    """

    if is_cached(output_path, cache, 1):
        return
    headers={"Accept-Encoding": "gzip"}
    print(f"Requesting {url}")
    request = urllib.request.Request(url, headers=headers)
    response = urllib.request.urlopen(request, context=ctx)
    content = gzip.decompress(response.read()).decode()

    with open(output_path, "w") as f:
        f.write(content)

def download(url, output_path, cache=0):
    """Download file, write to output path; use optional cache
    Cached files can help speed development iterations by > 2x, and some
    development scenarios (e.g. on a train or otherwise without an Internet
    connection) can be impossible without it.
    """

    if is_cached(output_path, cache, 1):
        return
    print(f"Requesting {url}")
    request = urllib.request.Request(url)
    response = urllib.request.urlopen(request, context=ctx)
    content = response.read().decode()

    # print('content')
    # print(content)

    with open(output_path, "w") as f:
        f.write(content)
