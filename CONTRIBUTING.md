Checklist (and a short version for the impatient)
=================================================

  * Commits:

    - Make commits of logical units.

    - Check for unnecessary whitespace with "git diff --check" before
      committing.

    - Commit using Unix line endings (check the settings around "crlf" in
      git-config(1)).

    - Do not check in commented out code or unneeded files.

    - The first line of the commit message should be a short
      description (50 characters is the soft limit, excluding ticket
      number(s)), and should skip the full stop.

    - Associate the issue in the message. The first line should include
      the issue number in the form "(GH-#XXXX) Rest of message".

    - The body should provide a meaningful commit message, which:

      - uses the imperative, present tense: "change", not "changed" or
        "changes".

      - includes motivation for the change, and contrasts its
        implementation with the previous behavior.

    - Make sure that you have tests for the bug you are fixing, or
      feature you are adding.

    - Make sure the test suites passes after your commit:
      `bundle exec rspec spec/acceptance` More information on [testing](#Testing) below

    - When introducing a new feature, make sure it is properly
      documented in the README.md

  * Submission:

    * Pre-requisites:

      - Make sure you have a [GitHub account](https://github.com/join)

    * Preferred method:

      - Fork the repository on GitHub.

      - Push your changes to a topic branch in your fork of the
        repository. (the format GH-1234-short_description_of_change is
        usually preferred for this project).

      - Submit a pull request to the repository.
