# SPDX-FileCopyrightText: Copyright (c) 2025 Tim C for Adafruit Industries
# SPDX-License-Identifier: MIT

from asyncio import create_task, gather, run
from asyncio import sleep as async_sleep

import board
import socketpool
import wifi
from adafruit_httpserver import GET, FileResponse, Request, Response, Server, Websocket

from adafruit_opt4048 import OPT4048, ConversionTime, Mode, Range

pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, debug=True, root_path="opt4048_ws_static")

websocket: Websocket = None

READ_INTERVAL = 0.1  # seconds

i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
sensor = OPT4048(i2c)

sensor.range = Range.AUTO
sensor.conversion_time = ConversionTime.TIME_100MS
sensor.mode = Mode.CONTINUOUS


@server.route("/connect-websocket", GET)
def connect_client(request: Request):
    global websocket  # noqa: PLW0603, global use

    if websocket is not None:
        websocket.close()  # Close any existing connection

    websocket = Websocket(request)

    return websocket


server.start(str(wifi.radio.ipv4_address))


async def handle_http_requests():
    while True:
        server.poll()

        await async_sleep(0)


async def send_color_data_ws():
    while True:
        if websocket is not None:
            try:
                x, y, lux = sensor.cie
                out_msg = "---CIE Data---\n"
                out_msg += f"CIE x: {x}\n"
                out_msg += f"CIE y: {y}\n"
                out_msg += f"Lux: {lux}\n"
                out_msg += f"Color Temperature: {sensor.calculate_color_temperature(x, y)} K\n"
                out_msg += "-------------\n"

                websocket.send_message(out_msg, fail_silently=True)
            except RuntimeError:
                # error reading sensor
                pass

        await async_sleep(READ_INTERVAL)


async def main():
    await gather(
        create_task(handle_http_requests()),
        create_task(send_color_data_ws()),
    )


run(main())
