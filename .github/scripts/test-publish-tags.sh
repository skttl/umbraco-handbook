#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
regex=$(sed -n 's/.*GITHUB_REF_NAME" =~ \(.*\) ]]; then/\1/p' .github/workflows/publish.yml)
[[ -n "$regex" ]] || { echo 'Missing publish tag validation' >&2; exit 1; }
for tag in v17.0.0 v18.1.2 v19.0.0 v17.0.0-rc1 v18.0.0-rc1 v18.0.0-rc.1 v19.0.0-rc1 v19.0.0-rc.1 v17.1.0-alpha-beta; do
  [[ "$tag" =~ $regex ]] || { echo "Rejected valid tag: $tag" >&2; exit 1; }
  [[ "${BASH_REMATCH[1]}" == "${tag:1:2}" ]] || { echo "Wrong major: $tag" >&2; exit 1; }
done
for tag in v16.0.0-rc1 v20.0.0 18.0.0-rc1 v18.0 v18.0.0- v18.0.0-rc..1 v18.0.0-rc_1 v18.0.0-rc.1. v18.0.0-rc1/invalid v19.0.0-rc1/invalid; do
  if [[ "$tag" =~ $regex ]]; then
    echo "Accepted invalid tag: $tag" >&2
    exit 1
  fi
done
echo 'Publish tag validation passed'
