import time
import board
import digitalio

PIR_PIN = board.D0
LED_PIN = board.D1

ON_DURATION = 10


def main():
    print("STARTING")
    pir = digitalio.DigitalInOut(PIR_PIN)
    pir.direction = digitalio.Direction.INPUT
    led = digitalio.DigitalInOut(LED_PIN)
    led.direction = digitalio.Direction.OUTPUT

    last_move_time = 0

    pir_value = pir.value
    while True:
        now = time.monotonic()
        if pir.value != pir_value:
            print(f"{now} pir changed to {pir.value}")
            pir_value = pir.value
            if pir_value:
                last_move_time = now
                led.value = True
                print(f"{now} movement detected so resetting {last_move_time=}")

        if (now > last_move_time + ON_DURATION) and led.value:
            print(f"{now} {last_move_time=} over {ON_DURATION=} ago, turning off")
            led.value = False

        time.sleep(0.2)


if __name__ == "__main__":
    main()
