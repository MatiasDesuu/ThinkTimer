//go:build !windows
// +build !windows

package main

import "os/exec"

// setHiddenWindow is a no-op on non-Windows platforms.
func setHiddenWindow(cmd *exec.Cmd) {
	// nothing to do on other platforms
}
