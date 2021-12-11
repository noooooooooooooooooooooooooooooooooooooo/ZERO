# ZERO

A decentralized, p2p light drawing platform that shares across connected networks.

## Intended Goals

1. To create an open social platform such that authentication is seamless and/or automated (no usernames, passwords, etc.)*
2. Limit to canvas drawing and remove text input to both simplify input requirements (no categories, dropdowns, additional fields, etc.) and increase creative flexibility.
3. Allow for the highest number of potential participants (no initial gatekeeping) with the ability to mute posts from specified users locally (affects personal preferences, is not exposed outside to the network).
4. Contains the least amount of dependencies, third party libraries and code (could be less but this is the first attempt!)
5. Maintain a basic level of security for users - this isn't meant to protect sensitive data - this is intended for avoiding impersonation attempts (send a PR if you see anything that could be improved)
  
\* Depending on the branch, some contain working examples while some aren't ready yet. The default one on `main` assumes a user has a Metamask wallet (working). The `tweetnacl` one is still under development/testing.

This uses [DAM - Daisy-chain Ad-hoc Mesh-network](https://gun.eco/docs/DAM) - read about it for more details.