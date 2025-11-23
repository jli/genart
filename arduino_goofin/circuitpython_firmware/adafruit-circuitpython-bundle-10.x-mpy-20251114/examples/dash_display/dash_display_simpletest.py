# SPDX-FileCopyrightText: 2021 Eva Herrada for Adafruit Industries
# SPDX-License-Identifier: MIT

import time
from os import getenv

import adafruit_connection_manager
import adafruit_minimqtt.adafruit_minimqtt as MQTT
import board
import touchio
import wifi
from adafruit_io.adafruit_io import IO_MQTT
from digitalio import DigitalInOut, Direction, Pull

from adafruit_dash_display import Hub

up = DigitalInOut(board.BUTTON_UP)
up.direction = Direction.INPUT
up.pull = Pull.DOWN

select = DigitalInOut(board.BUTTON_SELECT)
select.direction = Direction.INPUT
select.pull = Pull.DOWN

down = DigitalInOut(board.BUTTON_DOWN)
down.direction = Direction.INPUT
down.pull = Pull.DOWN

back = touchio.TouchIn(board.CAP7)
submit = touchio.TouchIn(board.CAP8)

# Get WiFi details and Adafruit IO keys, ensure these are setup in settings.toml
# (visit io.adafruit.com if you need to create an account, or if you need your Adafruit IO key.)
ssid = getenv("CIRCUITPY_WIFI_SSID")
password = getenv("CIRCUITPY_WIFI_PASSWORD")
aio_username = getenv("ADAFRUIT_AIO_USERNAME")
aio_key = getenv("ADAFRUIT_AIO_KEY")

display = board.DISPLAY

print(f"Connecting to {ssid}")
wifi.radio.connect(ssid, password)
print(f"Connected to {ssid}!")

# Create a socket pool and ssl_context
pool = adafruit_connection_manager.get_radio_socketpool(wifi.radio)
ssl_context = adafruit_connection_manager.get_radio_ssl_context(wifi.radio)

# Initialize a new MQTT Client object
mqtt_client = MQTT.MQTT(
    broker="io.adafruit.com",
    username=aio_username,
    password=aio_key,
    socket_pool=pool,
    ssl_context=ssl_context,
)

# Initialize an Adafruit IO MQTT Client
io = IO_MQTT(mqtt_client)


def pub_lamp(lamp):
    if isinstance(lamp, str):
        lamp = eval(lamp)
    iot.publish("lamp", str(not lamp))
    # funhouse.set_text(f"Lamp: {not lamp}", 0)
    time.sleep(0.3)


iot = Hub(display=display, io_mqtt=io, nav=(up, select, down, back, submit))

iot.add_device(
    feed_key="lamp",
    default_text="Lamp: ",
    formatted_text="Lamp: {}",
    pub_method=pub_lamp,
)
iot.add_device(
    feed_key="temperature",
    default_text="Temperature: ",
    formatted_text="Temperature: {:.1f} C",
)
iot.add_device(feed_key="humidity", default_text="Humidity: ", formatted_text="Humidity: {:.2f}%")

iot.get()

while True:
    iot.loop()
    time.sleep(0.01)
