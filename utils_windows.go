//go:build windows
// +build windows

package main

import (
	"os/exec"
	"syscall"
)

// setHiddenWindow sets the process attribute to hide the console window on Windows.
func setHiddenWindow(cmd *exec.Cmd) {
	if cmd == nil {
		return
	}
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	// HideWindow is supported on Windows to prevent a new console from flashing.
	cmd.SysProcAttr.HideWindow = true
}
