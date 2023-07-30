import logging
import os

def get_logger(file_name):
    """Creates a log file and returns an object to interface with it.
    """
    logger = logging.getLogger(file_name)
    logger.setLevel(logging.DEBUG)
    # create file handler which logs even debug messages
    if not os.path.exists('log'):
        os.mkdir('log')
    fh = logging.FileHandler(f'log/development.log')
    fh.setLevel(logging.DEBUG)
    # create console handler with a higher log level
    ch = logging.StreamHandler()
    ch.setLevel(logging.ERROR)
    # create formatter and add it to the handlers
    format = f'%(asctime)s - %(levelname)s - {file_name} - %(funcName)s - %(lineno)d - %(thread)d - %(message)s'
    formatter = logging.Formatter(format)
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)
    # add the handlers to the logger
    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger


def init(_fresh_run, _fill_cache, _output_dir, _cache_dir, file_name):
    """Initializes global variables that are readable from importing modules.
    """
    global fresh_run, fill_cache, output_dir, cache_dir
    fresh_run = _fresh_run
    fill_cache = _fill_cache
    output_dir = _output_dir
    cache_dir = _cache_dir

    log_path = 'log/development.log'
    if not os.path.exists('log'):
        os.mkdir('log')
    elif os.path.exists(log_path):
        os.replace(log_path, 'log/development.1.log')

    print(f'Logging to {log_path}')
    return get_logger(file_name)
