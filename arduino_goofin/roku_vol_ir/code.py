import board
import time
import alarm
import alarm.pin

import adafruit_dotstar
import adafruit_irremote
import digitalio
import pulseio

RECEIVER_PIN = board.D7
TRANSMIT_PIN = board.D7

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


def send_tv_command(pwm, encoder, onboard_led, remote_name: str, command_name: str):
    """Send a TV IR command by name"""
    if not (codebook := REMOTES_COMMAND_TO_CODE.get(remote_name)):
        print(f"UNKNOWN {remote_name=}")
        return
    if not (code := codebook.get(command_name)):
        print(f"UNKNOWN {command_name=} for {remote_name=}")
        return

    encoder.transmit(pwm, code)
    print(f"Sent: {remote_name}:{command_name} {code}")
    blink_led(onboard_led, times=1, interval=0.02)


def blink_led(onboard_led, times: int = 3, interval: float = 0.1) -> None:
    """Blink the onboard LED a specified number of times"""
    for _ in range(times):
        onboard_led.value = True
        time.sleep(interval)
        onboard_led.value = False
        time.sleep(interval)


def smooth_color_fade(dotstar, from_color, to_color, duration=0.5, steps=20):
    """Smoothly fade from one color to another"""
    for i in range(steps + 1):
        t = i / steps
        r = int(from_color[0] * (1 - t) + to_color[0] * t)
        g = int(from_color[1] * (1 - t) + to_color[1] * t)
        b = int(from_color[2] * (1 - t) + to_color[2] * t)
        dotstar[0] = (r, g, b)
        time.sleep(duration / steps)


def smooth_brightness_fade(dotstar, color, from_brightness, to_brightness, duration=0.5, steps=20):
    """Smoothly fade brightness while keeping color constant"""
    for i in range(steps + 1):
        t = i / steps
        brightness = from_brightness * (1 - t) + to_brightness * t
        dotstar.brightness = brightness
        dotstar[0] = color
        time.sleep(duration / steps)


def send_loop():
    button_pins = [board.D12, board.D11, board.D10, board.D9]
    commands = ["power", "source", "vol_up", "vol_down"]
    buttons = []
    for pin in button_pins:
        button = digitalio.DigitalInOut(pin)
        button.direction = digitalio.Direction.INPUT
        button.pull = digitalio.Pull.UP
        buttons.append(button)

    # Set up onboard LED
    onboard_led = digitalio.DigitalInOut(board.LED)
    onboard_led.direction = digitalio.Direction.OUTPUT

    # Set up DotStar LED
    dotstar = adafruit_dotstar.DotStar(board.APA102_SCK, board.APA102_MOSI, 1, brightness=0.5)

    print("[debug] Starting DotStar startup sequence")
    dotstar[0] = (0, 0, 255)
    smooth_brightness_fade(dotstar, (0, 0, 255), 0, 0.5, duration=0.75, steps=35)
    smooth_color_fade(dotstar, (0, 0, 255), (128, 0, 128), duration=0.75, steps=35)
    print("[debug] DotStar steady purple (awake)")
    dotstar[0] = (128, 0, 128)

    pwm = pulseio.PulseOut(TRANSMIT_PIN, frequency=38000, duty_cycle=21845)
    encoder = adafruit_irremote.GenericTransmit(
        header=[9000, 4500], one=[560, 1690], zero=[560, 560], trail=560
    )
    button_states = [True] * 4
    button_press_times = [0.0] * 4
    last_repeat_times = [0.0] * 4
    last_activity_time = time.monotonic()
    just_woke_up = False  # Track if we just woke from sleep

    REPEAT_DELAY = 0.3  # 300ms before repeat starts
    REPEAT_INTERVAL = 0.02  # 20ms between repeats
    REPEATABLE_COMMANDS = ["vol_up", "vol_down"]
    SLEEP_TIMEOUT = 5  # Light sleep after 5 seconds of inactivity

    print("TV Remote Ready!")
    time.sleep(0.5)  # Let pins stabilize before reading

    while True:
        current_time = time.monotonic()
        activity_this_loop = False

        for i, button in enumerate(buttons):
            current_state = button.value

            # Button just pressed
            if not current_state and button_states[i]:
                # Process command immediately
                send_tv_command(pwm, encoder, onboard_led, "tv", commands[i])
                button_states[i] = False
                button_press_times[i] = current_time
                last_repeat_times[i] = current_time
                activity_this_loop = True

                if just_woke_up:
                    print("[sleep-debug] Wake sequence: fade in -> blue -> purple")
                    dotstar[0] = (0, 0, 255)
                    smooth_brightness_fade(dotstar, (0, 0, 255), 0, 0.5, duration=0.1, steps=10)
                    smooth_color_fade(dotstar, (0, 0, 255), (128, 0, 128), duration=0.1, steps=10)
                    dotstar[0] = (128, 0, 128)
                    just_woke_up = False

            # Button held down
            elif not current_state and not button_states[i]:
                activity_this_loop = True
                # Check if this is a repeatable command
                if commands[i] in REPEATABLE_COMMANDS:
                    time_held = current_time - button_press_times[i]
                    time_since_repeat = current_time - last_repeat_times[i]

                    # Start repeating after delay
                    if time_held >= REPEAT_DELAY and time_since_repeat >= REPEAT_INTERVAL:
                        send_tv_command(pwm, encoder, onboard_led, "tv", commands[i])
                        last_repeat_times[i] = current_time

            # Button released
            elif current_state and not button_states[i]:
                button_states[i] = True
                button_press_times[i] = 0.0
                last_repeat_times[i] = 0.0

        # Update last activity time
        if activity_this_loop:
            last_activity_time = current_time

        # Check for inactivity timeout - try light sleep!
        time_inactive = current_time - last_activity_time
        if time_inactive >= SLEEP_TIMEOUT:
            print(f"[sleep-debug] Inactive for {time_inactive:.1f}s, trying light sleep...")

            print("[sleep-debug] Sleep sequence: purple -> blue -> fade out")
            smooth_color_fade(dotstar, (128, 0, 128), (0, 0, 255), duration=0.75, steps=35)
            smooth_brightness_fade(dotstar, (0, 0, 255), 0.5, 0, duration=0.75, steps=35)
            dotstar[0] = (0, 0, 0)
            print("[sleep-debug] OFF")

            # Turn off onboard LED while sleeping
            onboard_led.value = False

            # Deinitialize button pins before creating alarms
            for button in buttons:
                button.deinit()

            # Try light sleep (continues execution after wake)
            try:
                # Create pin alarms for all buttons
                pin_alarms = [
                    alarm.pin.PinAlarm(pin=button_pins[0], value=False, pull=True),
                    alarm.pin.PinAlarm(pin=button_pins[1], value=False, pull=True),
                    alarm.pin.PinAlarm(pin=button_pins[2], value=False, pull=True),
                    alarm.pin.PinAlarm(pin=button_pins[3], value=False, pull=True),
                ]

                print("[sleep-debug] Entering light sleep...")
                wake_alarm = alarm.light_sleep_until_alarms(*pin_alarms)
                print(f"[sleep-debug] Woke from light sleep! Alarm: {wake_alarm}")
            except Exception as e:
                print(f"[sleep-debug] Light sleep failed: {e}")

            # Reinitialize buttons after sleep/failure
            buttons = []
            for pin in button_pins:
                button = digitalio.DigitalInOut(pin)
                button.direction = digitalio.Direction.INPUT
                button.pull = digitalio.Pull.UP
                buttons.append(button)

            # Reset state tracking
            button_states = [True] * 4
            just_woke_up = True  # Flag to trigger wake sequence on next button press
            last_activity_time = time.monotonic()
            time.sleep(0.05)
        else:
            time.sleep(0.05)  # Normal polling interval


if __name__ == "__main__":
    print("hi")
    send_loop()
