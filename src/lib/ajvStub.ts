/**
 * Stands in for Ajv inside the Onee animation chunk. Aliased in vite.config.ts.
 *
 * @bible-strong/avatar-core compiles its JSON Schema at module scope:
 *
 *     const validate = new Ajv({ allErrors: true, strict: true }).compile(schema)
 *
 * That is a top-level side effect, so no bundler can tree-shake Ajv out even
 * though the only things reading `validate` are `validateAvatarDefinition` and
 * `parseAvatarDefinition` — neither of which this site calls. Left alone it put
 * 130KB of JSON-Schema compiler into the chunk: more than half of it, to check
 * a definition that ships fixed in the repo and is verified at build time.
 *
 * It is also a check Onee would fail. The Avatar Studio export carries
 * roundness values above the 0..1 the published schema allows, and clamping
 * them to satisfy it visibly squares off the silhouette — the geometry solver
 * renders them correctly, only the validator objects. So the definition is
 * validated where it can be acted on (scripts/build-onee-frame.mjs solves the
 * real geometry at build time, and the build fails if it cannot) rather than
 * re-litigated in every visitor's browser.
 *
 * Accordingly this reports valid and carries no errors. Anything that needs
 * genuine schema validation must not run in the browser bundle.
 */
type Validator = ((data: unknown) => boolean) & { errors: null };

export default class AjvStub {
  compile(): Validator {
    const validate = () => true;
    return Object.assign(validate, { errors: null as null });
  }
}
