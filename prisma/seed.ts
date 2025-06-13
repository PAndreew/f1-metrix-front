// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite'; // Make sure to install 'sqlite' and 'sqlite3'

const prisma = new PrismaClient();

// Helper to safely parse floats, returning null if parsing fails or input is null/undefined
function safeParseFloat(value: number): number | null {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}

// Helper to safely parse integers
function safeParseInt(value: number): number | null {
    if (value === null || value === undefined || String(value).trim() === '') {
      return null;
    }
    const num = parseInt(String(value), 10);
    return isNaN(num) ? null : num;
  }

async function main() {
  console.log(`Start seeding ...`);

  const sqliteDb = await open({
    filename: 'f1_results.db', // ADJUST PATH TO YOUR SQLITE DB if needed
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY // Open in read-only mode
  });

  // --- Seed AgeEffectsCoefficients ---
  console.log('Seeding AgeEffectsCoefficients...');
  const ageEffectsSqlite = await sqliteDb.all('SELECT * FROM age_effects_coefficients');
  for (const row of ageEffectsSqlite) {
    await prisma.ageEffectsCoefficients.create({
      data: {
        age_bin_label: row.age_bin_label,
        coefficient: safeParseFloat(row.coefficient),
      },
    });
  }
  console.log('Seeded AgeEffectsCoefficients.');

  // --- Seed DriverAllTimeRankingU0 ---
  console.log('Seeding DriverAllTimeRankingU0...');
  const allTimeRankingSqlite = await sqliteDb.all('SELECT * FROM driver_all_time_ranking_u0');
  for (const row of allTimeRankingSqlite) {
    await prisma.driverAllTimeRankingU0.create({
      data: {
        driverid: row.driverid!, // Assuming driverid is always present and parsable
        u0_skill_intercept: safeParseFloat(row.u0_skill_intercept),
        u1_skill_trend: safeParseFloat(row.u1_skill_trend),
        forename: row.forename,
        surname: row.surname,
      },
    });
  }
  console.log('Seeded DriverAllTimeRankingU0.');

  // --- Seed DriverCareerEffects ---
  console.log('Seeding DriverCareerEffects...');
  const careerEffectsSqlite = await sqliteDb.all('SELECT * FROM driver_career_effects');
  for (const row of careerEffectsSqlite) {
    await prisma.driverCareerEffects.create({
      data: {
        driverid: row.driverid!, // Assuming driverid is always present and parsable
        u0_skill_intercept: safeParseFloat(row.u0_skill_intercept),
        u1_skill_trend: safeParseFloat(row.u1_skill_trend),
        forename: row.forename,
        surname: row.surname,
      },
    });
  }
  console.log('Seeded DriverCareerEffects.');

  // --- Seed DriverRankingsBase ---
  console.log('Seeding DriverRankingsBase...');
  const baseRankingsSqlite = await sqliteDb.all('SELECT * FROM driver_rankings_base');
  for (const row of baseRankingsSqlite) {
    await prisma.driverRankingsBase.create({
      data: {
        driverid: row.driverid!, // Assuming driverid is always present and parsable
        residual: safeParseFloat(row.residual),
        forename: row.forename,
        surname: row.surname,
      },
    });
  }
  console.log('Seeded DriverRankingsBase.');

  // --- Seed DriverYearlyPerformanceRankings ---
  console.log('Seeding DriverYearlyPerformanceRankings...');
  const yearlyRankingsSqlite = await sqliteDb.all('SELECT * FROM driver_yearly_performance_rankings');
  for (const row of yearlyRankingsSqlite) {
    await prisma.driverYearlyPerformanceRankings.create({
      data: {
        driverid: row.driverid!, // Assuming driverid is always present and parsable
        year: safeParseInt(row.year)!,         // Assuming year is always present and parsable
        yearly_performance_score: safeParseFloat(row.yearly_performance_score),
        u0_contrib: safeParseFloat(row.u0_contrib),
        u1_year_contrib: safeParseFloat(row.u1_year_contrib),
        age_contrib: safeParseFloat(row.age_contrib),
        exp_contrib: safeParseFloat(row.exp_contrib),
        forename: row.forename,
        surname: row.surname,
        yearly_rank: safeParseFloat(row.yearly_rank),
      },
    });
  }
  console.log('Seeded DriverYearlyPerformanceRankings.');

  // --- Seed ExperienceEffectsCoefficients ---
  console.log('Seeding ExperienceEffectsCoefficients...');
  const expEffectsSqlite = await sqliteDb.all('SELECT * FROM experience_effects_coefficients');
  for (const row of expEffectsSqlite) {
    await prisma.experienceEffectsCoefficients.create({
      data: {
        experience_level: row.experience_level,
        coefficient: safeParseFloat(row.coefficient),
      },
    });
  }
  console.log('Seeded ExperienceEffectsCoefficients.');

  // --- Seed ModelSummaryExtended ---
  console.log('Seeding ModelSummaryExtended...');
  const modelSummarySqlite = await sqliteDb.all('SELECT * FROM model_summary_extended');
  for (const row of modelSummarySqlite) {
    await prisma.modelSummaryExtended.create({
      data: {
        variable: row.variable,
        mean: safeParseFloat(row.mean),
        sd: safeParseFloat(row.sd),
        hdi_3: safeParseFloat(row['hdi_3%']), // Accessing column with '%'
        hdi_97: safeParseFloat(row['hdi_97%']),// Accessing column with '%'
        mcse_mean: safeParseFloat(row.mcse_mean),
        mcse_sd: safeParseFloat(row.mcse_sd),
        ess_bulk: safeParseFloat(row.ess_bulk),
        ess_tail: safeParseFloat(row.ess_tail),
        r_hat: safeParseFloat(row.r_hat),
      },
    });
  }
  console.log('Seeded ModelSummaryExtended.');

  // --- Seed VarianceFunctionsYearly ---
  console.log('Seeding VarianceFunctionsYearly...');
  const varianceYearlySqlite = await sqliteDb.all('SELECT * FROM variance_functions_yearly');
  for (const row of varianceYearlySqlite) {
    await prisma.varianceFunctionsYearly.create({
      data: {
        Year: safeParseInt(row.Year)!, // Assuming Year is always present and parsable
        Driver_Variance: safeParseFloat(row.Driver_Variance),
        Team_Variance: safeParseFloat(row.Team_Variance),
        Team_Year_Variance: safeParseFloat(row.Team_Year_Variance),
      },
    });
  }
  console.log('Seeded VarianceFunctionsYearly.');

  // --- Seed VarianceSummaryBase ---
  console.log('Seeding VarianceSummaryBase...');
  const varianceBaseSqlite = await sqliteDb.all('SELECT * FROM variance_summary_base');
  for (const row of varianceBaseSqlite) {
    await prisma.varianceSummaryBase.create({
      data: {
        Component: row.Component,
        Variance: safeParseFloat(row.Variance),
      },
    });
  }
  console.log('Seeded VarianceSummaryBase.');


  await sqliteDb.close();
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(`Error during seeding:`);
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });