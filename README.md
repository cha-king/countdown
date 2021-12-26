# countdown
A simple system-tray countdown timer for Google Calendar events.

## Note
Currently, this app is neither signed by Apple nor is it verified by Google for its OAuth implementation.
Google verification may be forthcoming, however, I don't intend to throw any money at this project, so
app signing is unlikely in the future. If preferred, steps to build from source can be found below.

## Background
A few years ago, a coworker of mine was adamant about maintaining a timer that would count down until their 
next meeting. At the time, they were setting the timer manually. It seemed like a relatively simple
and well-scoped project to implement software to do this automatically. 

## Installation
Pre-built releases can be found for your platform on the [releases page](https://github.com/cha-king/countdown/releases).

### Building from source
Alternatively, to build and install from source, clone this repo and run:
```
npm run make
```
The resulting package will be found in the `out` directory.

## Usage
For any forthcoming events in a given day, Countdown will display a countdown timer in the system tray,
counting down until the event.

Upon running the application, the user be prompted to log in to their Google account. Once done so,
all windows will close and the application will run in the background.
