import board
import time
import digitalio
import pulseio
import adafruit_irremote
from ir_codes import TV_COMMAND_TO_CODE

# Detect board capabilities
HAS_DOTSTAR = hasattr(board, "APA102_SCK") and hasattr(board, "APA102_MOSI")
print("[board-detect] HAS_DOTSTAR: " + str(HAS_DOTSTAR))

HAS_ALARM = False
try:
    import alarm
    import alarm.pin
    HAS_ALARM = True
    print("[board-detect] HAS_ALARM: " + str(HAS_ALARM))
except ImportError as e:
    print("[board-detect] WARNING: alarm module not available: " + str(e))
    print("[board-detect] HAS_ALARM: " + str(HAS_ALARM))

if HAS_DOTSTAR:
    try:
        import adafruit_dotstar
        print("[board-detect] adafruit_dotstar imported successfully")
    except ImportError as e:
        print("[board-detect] WARNING: Failed to import adafruit_dotstar: " + str(e))
        HAS_DOTSTAR = False
        print("[board-detect] HAS_DOTSTAR set to False due to import error")

# Pin configuration based on board type
if HAS_DOTSTAR:
    # ItsyBitsy (or other board with DotStar) - use original pins
    BUTTON_PINS = [board.D12, board.D11, board.D10, board.D9]
    TRANSMIT_PIN = board.D7
    print("[pin-config] ItsyBitsy pins: D12, D11, D10, D9 (buttons), D7 (IR)")
else:
    # Trinket M0 - use D0-D4
    BUTTON_PINS = [board.D0, board.D1, board.D2, board.D3]
    TRANSMIT_PIN = board.D4
    print("[pin-config] Trinket M0 pins: D0, D1, D2, D3 (buttons), D4 (IR)")


def send_tv_command(pwm, encoder, onboard_led, command_name: "str"):
    """Send a TV IR command by name"""
    code = TV_COMMAND_TO_CODE.get(command_name)
    if not code:
        print("UNKNOWN command_name=" + command_name)
        return

    encoder.transmit(pwm, code)
    print("Sent: " + command_name + " " + str(code))
    blink_led(onboard_led, times=1, interval=0.02)


def blink_led(onboard_led, times: "int" = 3, interval: "float" = 0.1) -> "None":
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


def main():
    commands = ["power", "source", "vol_up", "vol_down"]
    buttons = []

    for pin in BUTTON_PINS:
        button = digitalio.DigitalInOut(pin)
        button.direction = digitalio.Direction.INPUT
        button.pull = digitalio.Pull.UP
        buttons.append(button)

    onboard_led = digitalio.DigitalInOut(board.D13)
    onboard_led.direction = digitalio.Direction.OUTPUT

    # Set up DotStar if available
    dotstar = None
    if HAS_DOTSTAR:
        dotstar = adafruit_dotstar.DotStar(board.APA102_SCK, board.APA102_MOSI, 1, brightness=0.5)
        print("[debug] Starting DotStar startup sequence")
        dotstar[0] = (0, 0, 255)
        smooth_brightness_fade(dotstar, (0, 0, 255), 0, 0.5, duration=0.75, steps=35)
        smooth_color_fade(dotstar, (0, 0, 255), (128, 0, 128), duration=0.75, steps=35)
        print("[debug] DotStar steady purple (awake)")
        dotstar[0] = (128, 0, 128)

    pwm = pulseio.PulseOut(TRANSMIT_PIN, frequency=38000, duty_cycle=32768)
    encoder = adafruit_irremote.GenericTransmit(
        header=[9000, 4500], one=[560, 1690], zero=[560, 560], trail=560
    )

    button_states = [True] * 4
    button_press_times = [0.0] * 4
    last_repeat_times = [0.0] * 4
    last_activity_time = time.monotonic()
    just_woke_up = False

    REPEAT_DELAY = 0.3
    REPEAT_INTERVAL = 0.02
    REPEATABLE_COMMANDS = ["vol_up", "vol_down"]
    SLEEP_TIMEOUT = 5

    board_name = "Trinket M0" if not HAS_DOTSTAR else "ItsyBitsy"
    print(board_name + " TV Remote Ready!")
    dotstar_status = "Yes" if HAS_DOTSTAR else "No"
    alarm_status = "Yes" if HAS_ALARM else "No"
    print("DotStar: " + dotstar_status + ", Alarm/Sleep: " + alarm_status)
    time.sleep(0.5)

    while True:
        current_time = time.monotonic()
        activity_this_loop = False

        for i, button in enumerate(buttons):
            current_state = button.value

            if not current_state and button_states[i]:
                send_tv_command(pwm, encoder, onboard_led, commands[i])
                button_states[i] = False
                button_press_times[i] = current_time
                last_repeat_times[i] = current_time
                activity_this_loop = True

                if just_woke_up and dotstar:
                    print("[sleep-debug] Wake sequence: fade in -> blue -> purple")
                    dotstar[0] = (0, 0, 255)
                    smooth_brightness_fade(dotstar, (0, 0, 255), 0, 0.5, duration=0.1, steps=10)
                    smooth_color_fade(dotstar, (0, 0, 255), (128, 0, 128), duration=0.1, steps=10)
                    dotstar[0] = (128, 0, 128)
                    just_woke_up = False

            elif not current_state and not button_states[i]:
                activity_this_loop = True
                if commands[i] in REPEATABLE_COMMANDS:
                    time_held = current_time - button_press_times[i]
                    time_since_repeat = current_time - last_repeat_times[i]

                    if time_held >= REPEAT_DELAY and time_since_repeat >= REPEAT_INTERVAL:
                        send_tv_command(pwm, encoder, onboard_led, commands[i])
                        last_repeat_times[i] = current_time

            elif current_state and not button_states[i]:
                button_states[i] = True
                button_press_times[i] = 0.0
                last_repeat_times[i] = 0.0

        if activity_this_loop:
            last_activity_time = current_time

        # Sleep functionality (only if alarm module available and dotstar present)
        if HAS_ALARM and dotstar:
            time_inactive = current_time - last_activity_time
            if time_inactive >= SLEEP_TIMEOUT:
                print("[sleep-debug] Inactive for " + str(time_inactive) + "s, trying light sleep...")

                print("[sleep-debug] Sleep sequence: purple -> blue -> fade out")
                smooth_color_fade(dotstar, (128, 0, 128), (0, 0, 255), duration=0.75, steps=35)
                smooth_brightness_fade(dotstar, (0, 0, 255), 0.5, 0, duration=0.75, steps=35)
                dotstar[0] = (0, 0, 0)
                print("[sleep-debug] OFF")

                onboard_led.value = False

                for button in buttons:
                    button.deinit()

                try:
                    pin_alarms = [
                        alarm.pin.PinAlarm(pin=BUTTON_PINS[0], value=False, pull=True),
                        alarm.pin.PinAlarm(pin=BUTTON_PINS[1], value=False, pull=True),
                        alarm.pin.PinAlarm(pin=BUTTON_PINS[2], value=False, pull=True),
                        alarm.pin.PinAlarm(pin=BUTTON_PINS[3], value=False, pull=True),
                    ]

                    print("[sleep-debug] Entering light sleep...")
                    wake_alarm = alarm.light_sleep_until_alarms(*pin_alarms)
                    print("[sleep-debug] Woke from light sleep! Alarm: " + str(wake_alarm))
                except Exception as e:
                    print("[sleep-debug] Light sleep failed: " + str(e))

                buttons = []
                for pin in BUTTON_PINS:
                    button = digitalio.DigitalInOut(pin)
                    button.direction = digitalio.Direction.INPUT
                    button.pull = digitalio.Pull.UP
                    buttons.append(button)

                button_states = [True] * 4
                just_woke_up = True
                last_activity_time = time.monotonic()
                time.sleep(0.05)
        else:
            time.sleep(0.01)


if __name__ == "__main__":
    print("Starting unified TV volume control...")
    main()
