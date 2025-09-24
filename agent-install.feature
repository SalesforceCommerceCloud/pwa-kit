Feature: Install agent rules and guidelines
  As an automation agent
  I want to install the appropriate agent rules/guidelines into a project
  So that developers get the correct rule files configured for their host IDE

  Background:
    Given the MCP server exposes the tool "install_agent_rules"

  Scenario: Cursor host installs rule when missing
    Given a project root without ".cursor/rules/@pwa-kit-mcp.mdc"
    And the host agent is "cursor"
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
      | hostAgent   | cursor            |
    Then the directory ".cursor/rules" should be created under the project root
    And the file "@pwa-kit-mcp.mdc" should be copied into ".cursor/rules"
    And the tool response text should contain "Installed rule to"

  Scenario: Cursor host already installed with identical content
    Given a project root with ".cursor/rules/@pwa-kit-mcp.mdc" identical to the source rule
    And the host agent is "cursor"
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
      | hostAgent   | cursor            |
    Then the tool should not copy any files
    And the tool response text should contain "Rule already installed"

  Scenario: Cursor host existing file differs and may be out of date
    Given a project root with ".cursor/rules/@pwa-kit-mcp.mdc" whose content differs from the source rule
    And the host agent is "cursor"
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
      | hostAgent   | cursor            |
    Then the tool should not overwrite the existing file
    And the tool response text should contain "may be out of date"

  Scenario: Non-Cursor host installs AGENTS.md to project root when missing
    Given a project root without "AGENTS.md"
    And the host agent is "vscode"
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
      | hostAgent   | vscode            |
    Then the file "AGENTS.md" should be copied into the project root
    And the tool response text should contain "Installed rule to"

  Scenario: Non-Cursor host already installed AGENTS.md with identical content
    Given a project root with "AGENTS.md" identical to the source guidelines
    And the host agent is "vscode"
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
      | hostAgent   | vscode            |
    Then the tool should not copy any files
    And the tool response text should contain "Rule already installed"

  Scenario: Non-Cursor host existing AGENTS.md differs and may be out of date
    Given a project root with "AGENTS.md" whose content differs from the source guidelines
    And the host agent is "vscode"
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
      | hostAgent   | vscode            |
    Then the tool should not overwrite the existing file
    And the tool response text should contain "may be out of date"

  Scenario: Missing hostAgent behaves as non-Cursor and installs AGENTS.md
    Given a project root without "AGENTS.md"
    And the host agent is not provided
    When I call the tool "install_agent_rules" with:
      | projectRoot | <ABS_PROJECT_ROOT> |
    Then the file "AGENTS.md" should be copied into the project root
    And the tool response text should contain "Installed rule to"

  Scenario: Missing required projectRoot argument returns an error
    Given no project root argument is provided
    When I call the tool "install_agent_rules" with:
      | hostAgent | cursor |
    Then the tool response text should contain "Missing required argument: projectRoot"


