import board
import time
import digitalio
import pulseio
import adafruit_irremote
import adafruit_dotstar
import alarm
import alarm.pin
from ir_codes import TV_COMMAND_TO_CODE

# ============================================================================
# Configuration
# ============================================================================

# ItsyBitsy M4 pins
BUTTON_PINS = [board.D12, board.D11, board.D10, board.D9]
TRANSMIT_PIN = board.D7

# Timing configuration
LIGHT_SLEEP_TIMEOUT = 5
REPEAT_DELAY = 0.3
REPEAT_INTERVAL = 0.02
POLL_INTERVAL = 0.05  # 50ms polling for efficiency

# Commands
REPEATABLE_COMMANDS = ["vol_up", "vol_down"]
COMMANDS = ["power", "source", "vol_up", "vol_down"]


# ============================================================================
# LED Animations
# ============================================================================


def smooth_color_fade(dotstar, from_color, to_color, duration=0.5, steps=20):
    """Smoothly fade from one color to another"""
    for i in range(steps + 1):
        t = i / steps
        r = int(from_color[0] * (1 - t) + to_color[0] * t)
        g = int(from_color[1] * (1 - t) + to_color[1] * t)
        b = int(from_color[2] * (1 - t) + to_color[2] * t)
        dotstar[0] = (r, g, b)
        time.sleep(duration / steps)


def smooth_brightness_fade(
    dotstar, color, from_brightness, to_brightness, duration=0.5, steps=20
):
    """Smoothly fade brightness while keeping color constant"""
    for i in range(steps + 1):
        t = i / steps
        brightness = from_brightness * (1 - t) + to_brightness * t
        dotstar.brightness = brightness
        dotstar[0] = color
        time.sleep(duration / steps)


def indicate_startup(dotstar):
    """Show startup animation"""
    print("[anim] DotStar startup: fade in blue -> purple")
    dotstar[0] = (0, 0, 255)
    smooth_brightness_fade(dotstar, (0, 0, 255), 0, 0.5, duration=0.75, steps=35)
    smooth_color_fade(dotstar, (0, 0, 255), (128, 0, 128), duration=0.75, steps=35)
    dotstar[0] = (128, 0, 128)


def indicate_wake(dotstar):
    """Show wake animation"""
    print("[anim] Wake: quick fade blue -> purple")
    dotstar[0] = (0, 0, 255)
    smooth_brightness_fade(dotstar, (0, 0, 255), 0, 0.5, duration=0.1, steps=10)
    smooth_color_fade(dotstar, (0, 0, 255), (128, 0, 128), duration=0.1, steps=10)
    dotstar[0] = (128, 0, 128)


def indicate_sleep(dotstar):
    """Show sleep animation"""
    print("[anim] Sleep: purple -> blue -> fade out")
    smooth_color_fade(dotstar, (128, 0, 128), (0, 0, 255), duration=0.75, steps=35)
    smooth_brightness_fade(dotstar, (0, 0, 255), 0.5, 0, duration=0.75, steps=35)
    dotstar[0] = (0, 0, 0)


def blink_led(onboard_led, times=1, interval=0.02):
    """Blink the onboard LED"""
    for _ in range(times):
        onboard_led.value = True
        time.sleep(interval)
        onboard_led.value = False
        time.sleep(interval)


# ============================================================================
# IR Transmission
# ============================================================================


def send_tv_command(pwm, encoder, onboard_led, command_name):
    """Send a TV IR command by name"""
    code = TV_COMMAND_TO_CODE.get(command_name)
    if not code:
        print("[ir] UNKNOWN command:", command_name)
        return

    encoder.transmit(pwm, code)
    print("[ir] Sent:", command_name, code)
    blink_led(onboard_led, times=1, interval=0.02)


# ============================================================================
# Hardware Initialization
# ============================================================================


def init_buttons(button_pins):
    """Initialize button GPIO with pull-ups"""
    buttons = []
    for pin in button_pins:
        button = digitalio.DigitalInOut(pin)
        button.direction = digitalio.Direction.INPUT
        button.pull = digitalio.Pull.UP
        buttons.append(button)
    return buttons


def init_hardware():
    """Initialize all hardware and return dictionary of objects"""
    buttons = init_buttons(BUTTON_PINS)

    onboard_led = digitalio.DigitalInOut(board.D13)
    onboard_led.direction = digitalio.Direction.OUTPUT

    dotstar = adafruit_dotstar.DotStar(
        board.APA102_SCK, board.APA102_MOSI, 1, brightness=0.5
    )
    indicate_startup(dotstar)

    pwm = pulseio.PulseOut(TRANSMIT_PIN, frequency=38000, duty_cycle=32768)
    encoder = adafruit_irremote.GenericTransmit(
        header=[9000, 4500], one=[560, 1690], zero=[560, 560], trail=560
    )

    return {
        "buttons": buttons,
        "onboard_led": onboard_led,
        "dotstar": dotstar,
        "pwm": pwm,
        "encoder": encoder,
    }


# ============================================================================
# Button Handling
# ============================================================================


def poll_buttons(buttons, button_states, button_timings, current_time):
    """
    Poll buttons and return (activity_occurred, commands_to_send)

    button_timings is a dict with keys: press_time, last_repeat
    """
    commands_to_send = []
    activity = False

    for i, button in enumerate(buttons):
        current_state = button.value

        # Button just pressed (transition from released to pressed)
        if not current_state and button_states[i]:
            commands_to_send.append(COMMANDS[i])
            button_states[i] = False
            button_timings["press_time"][i] = current_time
            button_timings["last_repeat"][i] = current_time
            activity = True

        # Button held down (check for repeat)
        elif not current_state and not button_states[i]:
            activity = True
            if COMMANDS[i] in REPEATABLE_COMMANDS:
                time_held = current_time - button_timings["press_time"][i]
                time_since_repeat = current_time - button_timings["last_repeat"][i]

                if time_held >= REPEAT_DELAY and time_since_repeat >= REPEAT_INTERVAL:
                    commands_to_send.append(COMMANDS[i])
                    button_timings["last_repeat"][i] = current_time

        # Button released
        elif current_state and not button_states[i]:
            button_states[i] = True
            button_timings["press_time"][i] = 0.0
            button_timings["last_repeat"][i] = 0.0

    return activity, commands_to_send


# ============================================================================
# Sleep Management
# ============================================================================
#
# DEEP SLEEP LIMITATION ON ITSYBITSY M4:
# The SAMD51 chip only supports deep sleep wake on specific "tamper" pins:
#   - IN0: PB00, IN1: PB02, IN2: PA02 (A0), IN3: PC00, IN4: PC01
#
# On the ItsyBitsy M4 Express, ONLY pin A0 (PA02) is accessible for deep sleep wake.
# PB02 is used for DotStar clock, and the other tamper pins aren't broken out.
#
# Our buttons use D12, D11, D10, D9 - NONE of these support deep sleep wake.
# To enable deep sleep, you'd need to move at least one button to pin A0.
#
# Current behavior: Falls back to light sleep (~1-2mA) instead of deep sleep (~50-150µA)
# Light sleep still gives 2-4 weeks battery life vs 3-4 days without sleep.
#
# References:
# - https://github.com/adafruit/circuitpython/issues/7902
# - https://github.com/adafruit/circuitpython/pull/5425
# ============================================================================


def attempt_light_sleep(buttons, dotstar, onboard_led):
    """
    Attempt light sleep and wake on button press.
    Returns True if sleep was successful.
    """
    print("[sleep] Entering light sleep...")

    indicate_sleep(dotstar)
    onboard_led.value = False

    # Deinit buttons before sleep
    for button in buttons:
        button.deinit()

    # Set up pin alarms for button wake
    try:
        pin_alarms = [
            alarm.pin.PinAlarm(pin=pin, value=False, pull=True) for pin in BUTTON_PINS
        ]
        wake_alarm = alarm.light_sleep_until_alarms(*pin_alarms)

        print("[sleep] Woke from light sleep:", type(wake_alarm).__name__)
        return True
    except Exception as e:
        print("[sleep] Light sleep failed:", e)
        return False


# ============================================================================
# Main Loop
# ============================================================================


def main():
    # Initialize hardware
    hw = init_hardware()
    buttons = hw["buttons"]
    onboard_led = hw["onboard_led"]
    dotstar = hw["dotstar"]
    pwm = hw["pwm"]
    encoder = hw["encoder"]

    # Initialize button state tracking
    button_states = [True] * 4  # True = released, False = pressed
    button_timings = {"press_time": [0.0] * 4, "last_repeat": [0.0] * 4}

    # Time tracking
    last_activity_time = time.monotonic()
    just_woke_from_light_sleep = False

    print("[ready] ItsyBitsy M4 TV Remote Ready!")
    print("[config] Light sleep:", LIGHT_SLEEP_TIMEOUT, "s")
    print("[config] Poll interval:", POLL_INTERVAL, "s")

    while True:
        current_time = time.monotonic()

        # Poll buttons
        activity, commands_to_send = poll_buttons(
            buttons, button_states, button_timings, current_time
        )

        # Send any IR commands
        for command in commands_to_send:
            send_tv_command(pwm, encoder, onboard_led, command)

            # Show wake animation if we just woke from light sleep
            if just_woke_from_light_sleep:
                indicate_wake(dotstar)
                just_woke_from_light_sleep = False

        # Update activity tracking
        if activity:
            last_activity_time = current_time

        # Sleep logic
        time_inactive = current_time - last_activity_time

        # Light sleep after inactivity
        if time_inactive >= LIGHT_SLEEP_TIMEOUT:
            attempt_light_sleep(buttons, dotstar, onboard_led)

            # Reinitialize buttons after sleep
            buttons = init_buttons(BUTTON_PINS)
            hw["buttons"] = buttons

            button_states = [True] * 4
            just_woke_from_light_sleep = True
            last_activity_time = time.monotonic()

            time.sleep(0.05)  # Debounce
        else:
            time.sleep(POLL_INTERVAL)


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print("[boot] Starting ItsyBitsy M4 TV Remote Control...")
    main()
