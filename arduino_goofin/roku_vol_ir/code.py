import board
import time

import adafruit_irremote
import digitalio
import pulseio

RECEIVER_PIN = board.D7
TRANSMIT_PIN = board.D7
LED_PIN = board.D5

# codes
TEALIGHTS_COMMAND_TO_CODE = {
    "on": (0, 255, 0, 255),
    "off": (0, 255, 64, 191),
    "2h": (0, 255, 32, 223),
    "4h": (0, 255, 96, 159),
    "6h": (0, 255, 16, 239),
    "8h": (0, 255, 80, 175),
    "candle_mode": (0, 255, 48, 207),
    "light_mode": (0, 255, 112, 143),
    "light_less": (0, 255, 8, 247),
    "light_more": (0, 255, 72, 183),
}
ROKU_COMMAND_TO_CODE = {
    "back": (87, 67, 102, 153),
    "home": (87, 67, 192, 63),
    "up": (87, 67, 152, 103),
    "down": (87, 67, 204, 51),
    "left": (87, 67, 120, 135),
    "right": (87, 67, 180, 75),
    "ok": (87, 67, 84, 171),
    "reset": (87, 67, 30, 225),
    "star": (87, 67, 134, 121),
    "rewind": (87, 67, 44, 211),
    "play_pause": (87, 67, 50, 205),
    "ffw": (87, 67, 170, 85),
    "netflix": (87, 67, 210, 45),
    "amazon": (87, 67, 8, 247),
    "rdio": (87, 67, 2, 253),
    "sling": (87, 67, 228, 27),
}
TV_COMMAND_TO_CODE = {
    "source": (32, 223, 244, 11),
    "power": (32, 223, 16, 239),
    "up": (32, 223, 162, 93),
    "down": (32, 223, 98, 157),
    "left": (32, 223, 226, 29),
    "right": (32, 223, 18, 237),
    "ok": (32, 223, 34, 221),
    "vol_up": (32, 223, 64, 191),
    "vol_down": (32, 223, 192, 63),
}
TEALIGHTS_CODE_TO_COMMAND = {v: k for k, v in TEALIGHTS_COMMAND_TO_CODE.items()}
ROKU_CODE_TO_COMMAND = {v: k for k, v in ROKU_COMMAND_TO_CODE.items()}
TV_CODE_TO_COMMAND = {v: k for k, v in TV_COMMAND_TO_CODE.items()}
REMOTES_COMMAND_TO_CODE = {
    "tealight": TEALIGHTS_COMMAND_TO_CODE,
    "roku": ROKU_COMMAND_TO_CODE,
    "tv": TV_COMMAND_TO_CODE,
}
REMOTES_CODE_TO_COMMAND = {
    "tealight": TEALIGHTS_CODE_TO_COMMAND,
    "roku": ROKU_CODE_TO_COMMAND,
    "tv": TV_CODE_TO_COMMAND,
}


def receive_loop():
    # Set up IR receiver
    pulsein = pulseio.PulseIn(RECEIVER_PIN, maxlen=120, idle_state=True)
    decoder = adafruit_irremote.GenericDecode()

    while True:
        print("Waiting for IR signal...")
        pulses = decoder.read_pulses(pulsein)
        try:
            code = decoder.decode_bits(pulses)
            for remote_typ, codebook in REMOTES_CODE_TO_COMMAND.items():
                if cmd := codebook.get(code):
                    print(f"received: [{remote_typ}] {cmd}")
                    break
            else:
                print(f"UNKNOWN code: {code}")
        except adafruit_irremote.IRNECRepeatException:
            print("Repeat code")
        except adafruit_irremote.IRDecodeException:
            print("Failed to decode")


def send_tv_command(pwm, encoder, led, remote_name: str, command_name: str):
    """Send a TV IR command by name"""
    if not (codebook := REMOTES_COMMAND_TO_CODE.get(remote_name)):
        print(f"UNKNOWN {remote_name=}")
        return
    if not (code := codebook.get(command_name)):
        print(f"UNKNOWN {command_name=} for {remote_name=}")
        return

    encoder.transmit(pwm, code)
    print(f"Sent: {remote_name}:{command_name} {code}")
    blink_led(led, times=2, interval=0.05)


def blink_led(led, times: int = 3, interval: float = 0.1) -> None:
    """Blink the LED a specified number of times"""
    for _ in range(times):
        led.value = True
        time.sleep(interval)
        led.value = False
        time.sleep(interval)


def send_loop():
    button_pins = [board.D13, board.D12, board.D11, board.D10, board.D9]
    commands = ["power", "source", "up", "down", "ok"]
    buttons = []
    for pin in button_pins:
        button = digitalio.DigitalInOut(pin)
        button.direction = digitalio.Direction.INPUT
        button.pull = digitalio.Pull.UP
        buttons.append(button)

    # Set up onboard LED (Metro M4 uses board.LED)
    led = digitalio.DigitalInOut(LED_PIN)
    led.direction = digitalio.Direction.OUTPUT

    pwm = pulseio.PulseOut(TRANSMIT_PIN, frequency=38000, duty_cycle=2**15)
    encoder = adafruit_irremote.GenericTransmit(
        header=[9000, 4500], one=[560, 1690], zero=[560, 560], trail=560
    )
    button_states = [True] * 5

    print("TV Remote Ready!")
    while True:
        for i, button in enumerate(buttons):
            current_state = button.value

            if not current_state and button_states[i]:
                send_tv_command(pwm, encoder, led, "tv", commands[i])
                button_states[i] = False
            elif current_state and not button_states[i]:
                button_states[i] = True

        time.sleep(0.05)


if __name__ == "__main__":
    print("hi")
    send_loop()
