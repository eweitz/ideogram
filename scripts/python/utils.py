import urllib.request
import time

def connect(host, user):
    """Wrapper for pymmsql.connect; enables caching
    """
    if fresh_run:
        connection = pymysql.connect(host=host, user=user)
    else:
        def cursor():
            return {'host': host,'user': user}
            def fetchall():
                return ''
        connection = {'cursor': cursor}

    return connection


def request(url, request_body=None):
    """Wrapper for urllib.request; includes caching
    """
    file_name = \
        url.replace('.', '_').replace('/', '_').replace(':', '_') \
            .replace('?', '_').replace('=', '_').replace('&', '_')

    if fresh_run:
        if request_body is not None:
            req = urllib.request.Request(url, data=request_body)
            data = urllib.request.urlopen(req).read().decode()
        else:
            with urllib.request.urlopen(url) as response:
                data = response.read().decode('utf-8')
        if fill_cache:
            with open(cache_dir + file_name, 'w') as file:
                file.write(data)
    else:
        with open(cache_dir + file_name) as file:
            data = file.read().decode('utf-8')

    return data


def natural_sort(l):
    """From https://stackoverflow.com/a/4836734
    """
    convert = lambda text: int(text) if text.isdigit() else text.lower()
    alphanum_key = lambda key: [convert(c) for c in re.split('([0-9]+)', key)]
    return sorted(l, key=alphanum_key)


def time_ms():
    return int(round(time.time() * 1000))


def chunkify(lst, n):
    return [lst[i::n] for i in range(n)]