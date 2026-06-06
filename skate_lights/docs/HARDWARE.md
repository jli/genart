# Hardware

Single skate (Milestone 1 target). v0 builds and runs with only the **bold**
items below; the rest are for upcoming milestones but the wiring/pin plan
reserves room for them now.

## Bill of materials

| Component | Part | v0? |
|---|---|---|
| MCU | **Seeed XIAO ESP32-S3** (standard, pre-soldered headers) | yes |
| LED strip | **BTF-Lighting 5V FCOB Addressable RGB, 160 LEDs/m, XGB1338 IC** (FastLED-compatible as WS2812B), ~30cm = 48 LEDs | yes |
| LED power | **MT3608 boost converter**, set to 5.0V, fed from cell+ | yes |
| Battery | **1x Molicel P26A or Samsung 30Q 18650**, in holder | yes |
| Battery protection | **Inline 1S BMS** (DW01 + 8205) between cell+ and load | yes |
| Charging | **TP4056 USB-C module** with protection (parallel to BMS+cell, separate from XIAO USB-C) | yes |
| Battery sense | **2x 100k resistors** (divider on A2) | yes |
| Decoupling | **470µF bulk cap** at strip 5V input | yes |
| Accelerometer | MPU6050 (I2C, 0x68) | Milestone 1 |
| Input | Single tactile momentary button | Milestone 1 |
| MPU decoupling | 0.1µF ceramic near MPU6050 VCC | Milestone 1 |
| Antenna | External U.FL antenna (shipped with XIAO) | when BLE lands |
| Display | SSD1306 OLED (I2C, 0x3C) | future |

## Wiring

```
[18650]--[BMS]--+--[TP4056 USB-C charger]   (charges cell)
                |
                +--[MT3608]--5V--[LED strip +]
                |                [LED strip GND]--GND
                |
                +--[XIAO BAT+ pad]   (XIAO runs from battery via its own LDO)
                   [XIAO BAT- pad]--GND
```

All grounds common. Put the 470µF bulk cap right at the strip's 5V input. When
the MPU is added, add a 0.1µF ceramic near its VCC.

## XIAO ESP32-S3 pin assignments

| Pin | Net | Used in v0 |
|-----|-----|-----------|
| D0  | LED data -> first LED of FCOB strip | yes |
| A2  | Battery voltage via 100k/100k divider from BAT+ (ADC1) | yes |
| D1  | Button (other side to GND, INPUT_PULLUP) | Milestone 1 |
| D4  | I2C SDA (MPU6050; OLED later on same bus) | Milestone 1 |
| D5  | I2C SCL (MPU6050; OLED later on same bus) | Milestone 1 |

Notes:
- A2 is GPIO3 on the XIAO S3, which is on **ADC1**. ADC2 must be avoided because
  it conflicts with WiFi. The firmware reads it with `analogReadMilliVolts`,
  which applies the chip's factory ADC calibration.
- The divider halves cell voltage (4.2V -> 2.1V at the pin), within range with
  11dB attenuation.
- The LED strip is powered from the MT3608, not the MCU. In deep sleep the
  firmware blanks the strip (writes a black frame), but the boost converter
  still idles; there is no hardware power cut for the strip in v0. A load switch
  / MOSFET on the strip 5V rail is a possible future addition.

## Power budget

- Brightness is firmware-capped at ~40% (`BRIGHTNESS_CAP = 100/255`) to hit the
  ≥4 hour runtime target and keep the strip/boost cool.
- 48 FCOB LEDs at full white, full brightness would be well over 1A at 5V; the
  cap and the typical non-white patterns keep average draw far below that.
- Real runtime needs to be measured once assembled; numbers above are planning
  estimates, not verified.
