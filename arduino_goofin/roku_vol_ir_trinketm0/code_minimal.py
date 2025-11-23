import board
import time
import digitalio
import pulseio
import pwmio
import adafruit_irremote
from ir_codes import TV_COMMAND_TO_CODE

# Trinket M0 minimal version - no DotStar, no sleep
BUTTON_PINS = [board.D0, board.D1, board.D2, board.D3]
TRANSMIT_PIN = board.D4

def send_tv_command(pwm, encoder, onboard_led, command_name):
    code = TV_COMMAND_TO_CODE.get(command_name)
    if not code:
        print("UNKNOWN command_name=" + command_name)
        return
    encoder.transmit(pwm, code)
    print("Sent: " + command_name + " " + str(code))
    blink_led(onboard_led, times=1, interval=0.02)

def blink_led(onboard_led, times=3, interval=0.1):
    for _ in range(times):
        onboard_led.value = True
        time.sleep(interval)
        onboard_led.value = False
        time.sleep(interval)

commands = ["power", "source", "vol_up", "vol_down"]
buttons = []

for pin in BUTTON_PINS:
    button = digitalio.DigitalInOut(pin)
    button.direction = digitalio.Direction.INPUT
    button.pull = digitalio.Pull.UP
    buttons.append(button)

onboard_led = digitalio.DigitalInOut(board.D13)
onboard_led.direction = digitalio.Direction.OUTPUT

# CircuitPython 6.x requires PWMOut carrier for PulseOut
pwm_carrier = pwmio.PWMOut(TRANSMIT_PIN, frequency=38000, duty_cycle=32768)
pwm = pulseio.PulseOut(pwm_carrier)
encoder = adafruit_irremote.GenericTransmit(
    header=[9000, 4500], one=[560, 1690], zero=[560, 560], trail=560
)

button_states = [True] * 4
button_press_times = [0.0] * 4
last_repeat_times = [0.0] * 4

REPEAT_DELAY = 0.3
REPEAT_INTERVAL = 0.02
REPEATABLE_COMMANDS = ["vol_up", "vol_down"]

print("Trinket M0 Ready")
time.sleep(0.5)

while True:
    current_time = time.monotonic()

    for i in range(4):
        current_state = buttons[i].value

        if not current_state and button_states[i]:
            send_tv_command(pwm, encoder, onboard_led, commands[i])
            button_states[i] = False
            button_press_times[i] = current_time
            last_repeat_times[i] = current_time

        elif not current_state and not button_states[i]:
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

    time.sleep(0.01)
