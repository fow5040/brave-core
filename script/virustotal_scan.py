import os
import sys
import argparse
import hashlib
import logging

from time import sleep
from virustotal_python import Virustotal

LOGGER = logging.getLogger(__name__)

WAIT_TIME = 60  # seconds

RC_NOT_FOUND = 0
RC_OK = 1

SCAN_THREATS_FOUND = 255
SCAN_ERROR = 1
SCAN_CLEAN = 0
SCAN_NOT_FOUND = -1


def sha256sum(filename):
    h = hashlib.sha256()
    b = bytearray(128*1024)
    mv = memoryview(b)
    with open(filename, 'rb', buffering=0) as f:
        for n in iter(lambda: f.readinto(mv), 0):
            h.update(mv[:n])
    return h.hexdigest()


def parse_response(response):
    if not response or 'json_resp' not in response.keys():
        LOGGER.error(f"Error on VT request: {response}")
        return SCAN_ERROR

    rc = response['json_resp']['response_code']

    if 'total' in response['json_resp'].keys():
        total = response['json_resp']['total']
        positives = response['json_resp']['positives']
        permalink = response['json_resp']['permalink']
        if positives > 0:
            LOGGER.warn(f"Threats detected: {positives}")
            return SCAN_THREATS_FOUND
        else:
            return SCAN_CLEAN
    return SCAN_NOT_FOUND


def main():

    parser = argparse.ArgumentParser(
        description="Scan a single file in VirusTotal and waits until report is complete")
    parser.add_argument('file', help='File to be scanned')

    args = parser.parse_args()

    if 'VT_API_KEY' not in os.environ:
        LOGGER.error('VT_API_KEY environment variable not set')
        sys.exit(SCAN_ERROR)

    vt_api_key = os.environ['VT_API_KEY']
    vt = Virustotal(vt_api_key)

    # Hash file
    file_hash = sha256sum(args.file)
    response = vt.file_report([file_hash])
    ret = parse_response(response)

    # If report is available, just exit with the appropriate RC
    if ret != SCAN_NOT_FOUND:
        sys.exit(ret)

    # Send file to VT for scanning
    vt.file_scan(args.file)

    while ret == SCAN_NOT_FOUND:
        LOGGER.info("Scan still running, sleeping")
        sleep(WAIT_TIME)
        # Try again
        response = vt.file_report([file_hash])
        ret = parse_response(response)

    sys.exit(ret)


if __name__ == "__main__":
    main()
