import board
import pulseio
import adafruit_irremote
from ir_codes import REMOTES_CODE_TO_COMMAND

# Pin configuration
RECEIVER_PIN = board.D4  # Use D4 for receiver (same as unified transmit pin)


def receive_loop():
    """
    Main loop for receiving and decoding IR signals.
    Point any IR remote at the receiver and press buttons to see decoded codes.
    """
    print("=" * 50)
    print("IR Receiver and Decoder")
    print("=" * 50)
    print(f"Receiver pin: {RECEIVER_PIN}")
    print("Point your IR remote at the receiver and press buttons...")
    print()

    # Set up IR receiver
    pulsein = pulseio.PulseIn(RECEIVER_PIN, maxlen=120, idle_state=True)
    decoder = adafruit_irremote.GenericDecode()

    while True:
        print("Waiting for IR signal...")
        pulses = decoder.read_pulses(pulsein)
        try:
            code = decoder.decode_bits(pulses)

            # Try to match against known remotes
            matched = False
            for remote_typ, codebook in REMOTES_CODE_TO_COMMAND.items():
                if cmd := codebook.get(code):
                    print(f"✓ KNOWN: [{remote_typ}] {cmd} -> {code}")
                    matched = True
                    break

            if not matched:
                print(f"✗ UNKNOWN code: {code}")
                print(f"  Add this to your code as:")
                print(f'  "button_name": {code},')

            print()

        except adafruit_irremote.IRNECRepeatException:
            print("  (Repeat code - button held down)")
        except adafruit_irremote.IRDecodeException as e:
            print(f"✗ Failed to decode: {e}")


if __name__ == "__main__":
    receive_loop()
