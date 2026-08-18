import socket
import sys
import time


port = int(sys.argv[1])
token = sys.argv[2]
command = f"echo {token}\nexit\n".encode()
output = bytearray()

with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as controller:
    controller.bind(("127.0.0.1", port))
    controller.settimeout(5)
    first_packet, peer = controller.recvfrom(65535)
    output.extend(first_packet)

    # Bash reads a datagram-backed stdin one byte at a time. Sending the whole
    # command in one datagram causes the unread remainder of that datagram to be
    # discarded, so each byte must be delivered separately.
    for value in command:
        controller.sendto(bytes([value]), peer)
        time.sleep(0.01)

    deadline = time.monotonic() + 5
    while token.encode() not in output and time.monotonic() < deadline:
        try:
            packet, _ = controller.recvfrom(65535)
            output.extend(packet)
        except TimeoutError:
            break

sys.stdout.buffer.write(output)
sys.exit(0 if token.encode() in output else 1)
