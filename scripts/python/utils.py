import settings

import pymysql
import urllib.request
import time
import re

fresh_run = settings.fresh_run
fill_cache = settings.fill_cache
output_dir = settings.output_dir
cache_dir = settings.cache_dir


def monkeypatched_execute(self, query, args=None):
    file_name = \
        query.strip().replace('.', '_').replace('/', '_').replace(':', '_') \
            .replace('?', '_').replace('=', '_').replace('&', '_') \
            .replace(',', '').replace(' ', '_').replace('\n', '')

    cache_path = cache_dir + 'sql__' + file_name

    cursor = self._original_execute(query, args=args)
    if fresh_run:
        if fill_cache:
            result = str(self.fetchall())
            open(cache_path, 'w').write(result)
    else:
        result = open(cache_path, 'r').read()
        self._result = result
    return cursor


pymysql.cursors.Cursor._original_execute = pymysql.cursors.Cursor.execute
pymysql.cursors.Cursor.execute = monkeypatched_execute


def request(url, request_body=None):
    """Wrapper for urllib.request; includes caching
    """
    file_name = \
        url.replace('.', '_').replace('/', '_').replace(':', '_') \
            .replace('?', '_').replace('=', '_').replace('&', '_')

    cache_path = cache_dir + file_name

    if fresh_run:
        if request_body is not None:
            req = urllib.request.Request(url, data=request_body)
            data = urllib.request.urlopen(req).read().decode()
        else:
            with urllib.request.urlopen(url) as response:
                data = response.read().decode('utf-8')
        if fill_cache:
            with open(cache_path, 'w') as file:
                file.write(data)
    else:
        with open(cache_path) as file:
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